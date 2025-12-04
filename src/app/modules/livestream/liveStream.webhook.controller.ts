import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { LiveStream } from './livestream.model'
import { LiveStreamService } from './livestream.service'

// Agora Webhook Handler
const agoraWebhook = catchAsync(async (req: Request, res: Response) => {
  const { event, channel, uid, timestamp } = req.body

  // Find stream by channel name
  const stream = await LiveStream.findOne({ channelName: channel }).lean()

  if (!stream) {
    return sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Stream not found, but webhook processed',
    })
  }

  // Handle different events
  switch (event) {
    case 'user_joined':
      await LiveStreamService.updateViewerCountToDB(
        stream._id.toString() as string,
        'join',
      )
      break

    case 'user_left':
      await LiveStreamService.updateViewerCountToDB(
        stream._id.toString(),
        'leave',
      )
      break

    case 'stream_published':
      // Stream started broadcasting
      // You might want to update stream status here
      break

    case 'stream_unpublished':
      // Stream stopped broadcasting
      // You might want to update stream status here
      break

    default:
      break
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Webhook processed successfully',
  })
})

export const LiveStreamWebhookController = {
  agoraWebhook,
}
