import { Request, Response } from 'express'
import catchAsync from '../../../shared/catchAsync'
import sendResponse from '../../../shared/sendResponse'
import { StatusCodes } from 'http-status-codes'
import { NotificationService } from './notification.service'
import { JwtPayload } from 'jsonwebtoken'

const getNotificationFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const result = await NotificationService.getNotificationFromDB(user)

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications Retrieved Successfully',
      data: result,
    })
  },
)

const adminNotificationFromDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.adminNotificationFromDB()

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notifications Retrieved Successfully',
      data: result,
    })
  },
)

const readNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const result = await NotificationService.readNotificationToDB(user)

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notification Read Successfully',
    data: result,
  })
})

const adminReadNotification = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.adminReadNotificationToDB()

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notification Read Successfully',
      data: result,
    })
  },
)
// Create notification
const createNotification = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload
  const payload = req.body

  const result = await NotificationService.createBroadcastNotification({
    ...payload,
    sender: user.authId,
  })

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: payload.scheduled
      ? 'Notification scheduled successfully'
      : 'Notification sent successfully',
    data: result,
  })
})

// Get notification history with optional tracking
const getNotificationsHistory = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload
    const { notificationId, opened, clicked } = req.body

    const trackingData = notificationId
      ? { notificationId, opened, clicked }
      : undefined

    const result = await NotificationService.getNotificationHistory(
      user,
      trackingData,
    )

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Notification history retrieved successfully',
      data: result,
    })
  },
)


export const NotificationController = {
  adminNotificationFromDB,
  getNotificationFromDB,
  readNotification,
  adminReadNotification,
  createNotification,
  getNotificationsHistory
}
