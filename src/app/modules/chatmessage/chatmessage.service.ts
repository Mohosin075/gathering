import { StatusCodes } from 'http-status-codes'
import { JwtPayload } from 'jsonwebtoken'
import ApiError from '../../../errors/ApiError'
import { User } from '../user/user.model'
import { Event } from '../event/event.model'
import { Attendance } from '../attendance/attendance.model'
import { Types } from 'mongoose'
import {
  ISendMessageDTO,
  IChatMessageResponseDTO,
  IChatListQueryDTO,
  IPaginatedResponse,
} from './chatmessage.interface'
import { ChatMessage } from './chatmessage.model'
import { USER_ROLES } from '../../../enum/user'
import { ChatSocketHelper } from './websocket.service'

// Send message to chat
const sendMessageToDB = async (
  user: JwtPayload,
  roomId: string,
  payload: ISendMessageDTO,
): Promise<IChatMessageResponseDTO> => {
  // Check if roomId is an Event ID and requires check-in
  if (Types.ObjectId.isValid(roomId)) {
    const isEventExist = await Event.findById(roomId).select('_id')
    if (isEventExist) {
      const userCheckIn = await Attendance.findOne({
        user: new Types.ObjectId(user.authId),
        event: new Types.ObjectId(roomId),
        status: 'checked-in',
      })

      if (!userCheckIn) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "Tonight's Chat is locked! You must physically check-in at the venue/event first to join the conversation.",
        )
      }
    }
  }

  // Get user profile
  const userProfile = await User.findById(user.authId).select('name profile')
  if (!userProfile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
  }

  // Create chat message
  const chatMessage = await ChatMessage.create({
    roomId,
    userId: user.authId,
    userProfile: {
      name: userProfile.name,
      avatar: userProfile.profile,
    },
    message: payload.message,
    messageType: payload.messageType || 'text',
  })

  // Broadcast message
  ChatSocketHelper.broadcastMessage(roomId, {
    id: chatMessage._id.toString(),
    userId: chatMessage.userId.toString(),
    userProfile: chatMessage.userProfile,
    message: chatMessage.message,
    messageType: chatMessage.messageType,
    formattedTime: chatMessage.formattedTime || '',
    likes: chatMessage.likes,
    hasLiked: false,
    createdAt: chatMessage.createdAt,
  })

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
  }
}

// Get chat messages
const getChatMessagesFromDB = async (
  user: JwtPayload,
  roomId: string,
  query: IChatListQueryDTO,
): Promise<IPaginatedResponse<IChatMessageResponseDTO>> => {
  const { page = 1, limit = 50, before } = query
  const skip = (page - 1) * limit

  // Build filter
  const filter: any = {
    roomId,
    isDeleted: false,
  }

  if (before) {
    filter.createdAt = { $lt: new Date(before) }
  }

  // Execute query
  const [messages, total] = await Promise.all([
    ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ChatMessage.countDocuments(filter),
  ])

  // Transform to response DTO
  const data: IChatMessageResponseDTO[] = messages.map(message => ({
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
    hasLiked: message.likedBy?.some(
      id => id.toString() === user.authId,
    ) || false,
    createdAt: message.createdAt,
  }))

  // Reverse order for chronological display
  data.reverse()

  return {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Chat messages retrieved successfully',
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    data,
  }
}

// Like a message
const likeMessageToDB = async (
  user: JwtPayload,
  messageId: string,
): Promise<{ likes: number; hasLiked: boolean }> => {
  const message = await ChatMessage.findById(messageId)
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Message not found')
  }

  // Check if user has already liked
  const hasLiked = message.likedBy?.some(
    id => id.toString() === user.authId,
  )

  if (hasLiked) {
    // Unlike
    message.likes = Math.max(0, message.likes - 1)
    message.likedBy = message.likedBy.filter(
      id => id.toString() !== user.authId,
    )
  } else {
    // Like
    message.likes += 1
    message.likedBy.push(user.authId)
  }

  await message.save()

  // Broadcast like update
  ChatSocketHelper.broadcastLike(
    message.roomId.toString(),
    messageId,
    user.authId
  )

  return {
    likes: message.likes,
    hasLiked: !hasLiked,
  }
}

// Delete a message
const deleteMessageToDB = async (
  user: JwtPayload,
  messageId: string,
): Promise<{ id: string; deleted: boolean }> => {
  const message = await ChatMessage.findById(messageId)
  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Message not found')
  }

  // Check if user is the message owner
  if (message.userId.toString() !== user.authId) {
    // Optional: Check if user is admin/moderator
    const userDoc = await User.findById(user.authId)
    if (
      userDoc?.role !== USER_ROLES.ORGANIZER &&
      userDoc?.role !== USER_ROLES.SUPER_ADMIN
    ) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'Only message owner or moderator can delete',
      )
    }
  }

  message.isDeleted = true
  message.deletedAt = new Date()
  await message.save()

  // Broadcast delete
  ChatSocketHelper.broadcastDelete(message.roomId.toString(), messageId)

  return {
    id: messageId,
    deleted: true,
  }
}

// Get chat participants
const getChatParticipantsFromDB = async (
  roomId: string,
): Promise<{
  total: number
  participants: Array<{ id: string; name: string; avatar?: string }>
}> => {
  // Get distinct users who sent messages
  const participants = await ChatMessage.aggregate([
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
  ])

  return {
    total: participants.length,
    participants,
  }
}

export const ChatService = {
  sendMessageToDB,
  getChatMessagesFromDB,
  likeMessageToDB,
  deleteMessageToDB,
  getChatParticipantsFromDB,
}
