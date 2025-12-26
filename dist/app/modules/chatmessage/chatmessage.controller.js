"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const chatmessage_service_1 = require("./chatmessage.service");
// Send message to chat
const sendMessage = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const result = await chatmessage_service_1.ChatService.sendMessageToDB(user, streamId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.CREATED,
        success: true,
        message: 'Message sent successfully',
        data: result,
    });
});
// Get chat messages
const getChatMessages = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { streamId } = req.params;
    const query = req.query;
    const result = await chatmessage_service_1.ChatService.getChatMessagesFromDB(user, streamId, query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat messages retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});
// Like a message
const likeMessage = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { messageId } = req.params;
    const result = await chatmessage_service_1.ChatService.likeMessageToDB(user, messageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message liked successfully',
        data: result,
    });
});
// Delete a message
const deleteMessage = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.user;
    const { messageId } = req.params;
    const result = await chatmessage_service_1.ChatService.deleteMessageToDB(user, messageId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Message deleted successfully',
        data: result,
    });
});
// Get chat participants
const getChatParticipants = (0, catchAsync_1.default)(async (req, res) => {
    const { streamId } = req.params;
    const result = await chatmessage_service_1.ChatService.getChatParticipantsFromDB(streamId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Chat participants retrieved successfully',
        data: result,
    });
});
exports.ChatController = {
    sendMessage,
    getChatMessages,
    likeMessage,
    deleteMessage,
    getChatParticipants,
};
