"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const http_status_codes_1 = require("http-status-codes");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("../user/user.model");
const chatmessage_model_1 = require("./chatmessage.model");
const user_1 = require("../../../enum/user");
const websocket_service_1 = require("./websocket.service");
// Send message to chat
const sendMessageToDB = async (user, roomId, payload) => {
    // Get user profile
    const userProfile = await user_model_1.User.findById(user.authId).select('name profile');
    if (!userProfile) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    // Create chat message
    const chatMessage = await chatmessage_model_1.ChatMessage.create({
        roomId,
        userId: user.authId,
        userProfile: {
            name: userProfile.name,
            avatar: userProfile.profile,
        },
        message: payload.message,
        messageType: payload.messageType || 'text',
    });
    // Broadcast message
    websocket_service_1.ChatSocketHelper.broadcastMessage(roomId, {
        id: chatMessage._id.toString(),
        userId: chatMessage.userId.toString(),
        userProfile: chatMessage.userProfile,
        message: chatMessage.message,
        messageType: chatMessage.messageType,
        formattedTime: chatMessage.formattedTime || '',
        likes: chatMessage.likes,
        hasLiked: false,
        createdAt: chatMessage.createdAt,
    });
    return {
        id: chatMessage._id.toString(),
        userId: chatMessage.userId.toString(),
        userProfile: chatMessage.userProfile,
        message: chatMessage.message,
        messageType: chatMessage.messageType,
        formattedTime: chatMessage.formattedTime || '',
        likes: chatMessage.likes,
        hasLiked: false,
        createdAt: chatMessage.createdAt,
    };
};
// Get chat messages
const getChatMessagesFromDB = async (user, roomId, query) => {
    const { page = 1, limit = 50, before } = query;
    const skip = (page - 1) * limit;
    // Build filter
    const filter = {
        roomId,
        isDeleted: false,
    };
    if (before) {
        filter.createdAt = { $lt: new Date(before) };
    }
    // Execute query
    const [messages, total] = await Promise.all([
        chatmessage_model_1.ChatMessage.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        chatmessage_model_1.ChatMessage.countDocuments(filter),
    ]);
    // Transform to response DTO
    const data = messages.map(message => {
        var _a;
        return ({
            id: message._id.toString(),
            userId: message.userId.toString(),
            userProfile: message.userProfile,
            message: message.message,
            messageType: message.messageType,
            formattedTime: new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            }),
            likes: message.likes,
            hasLiked: ((_a = message.likedBy) === null || _a === void 0 ? void 0 : _a.some(id => id.toString() === user.authId)) || false,
            createdAt: message.createdAt,
        });
    });
    // Reverse order for chronological display
    data.reverse();
    return {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Chat messages retrieved successfully',
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        data,
    };
};
// Like a message
const likeMessageToDB = async (user, messageId) => {
    var _a;
    const message = await chatmessage_model_1.ChatMessage.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Message not found');
    }
    // Check if user has already liked
    const hasLiked = (_a = message.likedBy) === null || _a === void 0 ? void 0 : _a.some(id => id.toString() === user.authId);
    if (hasLiked) {
        // Unlike
        message.likes = Math.max(0, message.likes - 1);
        message.likedBy = message.likedBy.filter(id => id.toString() !== user.authId);
    }
    else {
        // Like
        message.likes += 1;
        message.likedBy.push(user.authId);
    }
    await message.save();
    // Broadcast like update
    websocket_service_1.ChatSocketHelper.broadcastLike(message.roomId.toString(), messageId, user.authId);
    return {
        likes: message.likes,
        hasLiked: !hasLiked,
    };
};
// Delete a message
const deleteMessageToDB = async (user, messageId) => {
    const message = await chatmessage_model_1.ChatMessage.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'Message not found');
    }
    // Check if user is the message owner
    if (message.userId.toString() !== user.authId) {
        // Optional: Check if user is admin/moderator
        const userDoc = await user_model_1.User.findById(user.authId);
        if ((userDoc === null || userDoc === void 0 ? void 0 : userDoc.role) !== user_1.USER_ROLES.ORGANIZER &&
            (userDoc === null || userDoc === void 0 ? void 0 : userDoc.role) !== user_1.USER_ROLES.SUPER_ADMIN) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Only message owner or moderator can delete');
        }
    }
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();
    // Broadcast delete
    websocket_service_1.ChatSocketHelper.broadcastDelete(message.roomId.toString(), messageId);
    return {
        id: messageId,
        deleted: true,
    };
};
// Get chat participants
const getChatParticipantsFromDB = async (roomId) => {
    // Get distinct users who sent messages
    const participants = await chatmessage_model_1.ChatMessage.aggregate([
        {
            $match: {
                roomId,
                isDeleted: false,
            },
        },
        {
            $group: {
                _id: '$userId',
                name: { $first: '$userProfile.name' },
                avatar: { $first: '$userProfile.avatar' },
                lastMessageAt: { $max: '$createdAt' },
            },
        },
        {
            $project: {
                id: '$_id',
                name: 1,
                avatar: 1,
                _id: 0,
            },
        },
        { $sort: { lastMessageAt: -1 } },
    ]);
    return {
        total: participants.length,
        participants,
    };
};
exports.ChatService = {
    sendMessageToDB,
    getChatMessagesFromDB,
    likeMessageToDB,
    deleteMessageToDB,
    getChatParticipantsFromDB,
};
