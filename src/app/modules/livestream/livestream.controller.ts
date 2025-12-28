import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { LiveStreamService } from './livestream.service'
import { JwtPayload } from 'jsonwebtoken'
import { IStreamListQueryDTO } from './livestream.interface'

// Create Live Stream
const createLiveStream = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload as JwtPayload
  const result = await LiveStreamService.createLiveStreamToDB(user, req.body)

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Live stream created successfully',
    data: result,
  })
})

// Get Agora Token
const getAgoraToken = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { streamId } = req.params
  const { role = 'viewer' } = req.query

  const result = await LiveStreamService.getAgoraTokenFromDB(
    user,
    streamId,
    role as 'broadcaster' | 'viewer',
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Agora token generated successfully',
    data: result,
  })
})

// Get All Live Streams
const getAllLiveStreams = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as unknown as IStreamListQueryDTO

  const result = await LiveStreamService.getAllLiveStreamsFromDB(query)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    meta: result.meta,
    data: result.data,
  })
})

// Get My Live Streams
const getMyLiveStreams = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const query = req.query as unknown as IStreamListQueryDTO
  const result = await LiveStreamService.getMyLiveStreamsFromDB(user, query)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    meta: result.meta,
    data: result.data,
  })
})

// Get Single Live Stream
const getSingleLiveStream = catchAsync(async (req: Request, res: Response) => {
  const { streamId } = req.params
  const user = req.user as JwtPayload
  const result = await LiveStreamService.getSingleLiveStreamFromDB(
    streamId,
    user,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream retrieved successfully',
    data: result,
  })
})

// Update Live Stream
const updateLiveStream = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { streamId } = req.params
  const result = await LiveStreamService.updateLiveStreamToDB(
    user,
    streamId,
    req.body,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream updated successfully',
    data: result,
  })
})

// Delete Live Stream
const deleteLiveStream = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { streamId } = req.params
  const result = await LiveStreamService.deleteLiveStreamToDB(user, streamId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream deleted successfully',
    data: result,
  })
})

// Start Live Stream
const startLiveStream = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { streamId } = req.params
  const result = await LiveStreamService.startLiveStreamToDB(user, streamId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream started successfully',
    data: result,
  })
})

// End Live Stream
const endLiveStream = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const { streamId } = req.params
  const result = await LiveStreamService.endLiveStreamToDB(user, streamId)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream ended successfully',
    data: result,
  })
})

// Get Live Stream by Event ID
const getLiveStreamByEventId = catchAsync(async (req: Request, res: Response) => {
  const { eventId } = req.params
  const user = req.user as JwtPayload
  const result = await LiveStreamService.getLiveStreamByEventIdFromDB(
    eventId,
    user,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream retrieved successfully',
    data: result,
  })
})

// Get Live Stream by Ticket ID
const getLiveStreamByTicketId = catchAsync(async (req: Request, res: Response) => {
  const { ticketId } = req.params
  const user = req.user as JwtPayload
  const result = await LiveStreamService.getLiveStreamByTicketIdFromDB(
    ticketId,
    user,
  )

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Live stream retrieved successfully',
    data: result,
  })
})

export const LiveStreamController = {
  createLiveStream,
  getAgoraToken,
  getAllLiveStreams,
  getMyLiveStreams,
  getSingleLiveStream,
  updateLiveStream,
  deleteLiveStream,
  startLiveStream,
  endLiveStream,
  getLiveStreamByEventId,
  getLiveStreamByTicketId,
}
