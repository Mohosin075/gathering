import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { JwtPayload } from 'jsonwebtoken'
import { ChatService } from './chatmessage.service'
import { IChatListQueryDTO } from './chatmessage.interface'

// Send message to chat
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { roomId } = req.params
  const result = await ChatService.sendMessageToDB(user, roomId, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Message sent successfully',
    data: result,
  })
})

// Get chat messages
const getChatMessages = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { roomId } = req.params
  const query = req.query as unknown as IChatListQueryDTO

  const result = await ChatService.getChatMessagesFromDB(user, roomId, query)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat messages retrieved successfully',
    meta: result.meta,
    data: result.data,
  })
})

// Like a message
const likeMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { messageId } = req.params
  const result = await ChatService.likeMessageToDB(user, messageId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message liked successfully',
    data: result,
  })
})

// Delete a message
const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { messageId } = req.params
  const result = await ChatService.deleteMessageToDB(user, messageId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  })
})

// Get chat participants
const getChatParticipants = catchAsync(async (req: Request, res: Response) => {
  const { roomId } = req.params
  const result = await ChatService.getChatParticipantsFromDB(roomId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chat participants retrieved successfully',
    data: result,
  })
})

export const ChatController = {
  sendMessage,
  getChatMessages,
  likeMessage,
  deleteMessage,
  getChatParticipants,
}
