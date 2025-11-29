import { JwtPayload } from 'jsonwebtoken'
import { INotification } from './notification.interface'
import { Notification } from './notification.model'
import { sendSocketNotification } from '../../../helpers/socketHelper'
import { User } from '../user/user.model'

// get notifications
const getNotificationFromDB = async (
  user: JwtPayload,
): Promise<INotification> => {
  const result = await Notification.find({
    $or: [
      { targetAudience: 'ALL_USERS' },
      { 'deliveredTo.userId': user.authId },
    ],
  }).select(
    'title message notificationType targetAudience deliveredTo createdAt sender',
  )

  const unreadCount = await Notification.countDocuments({
    $or: [
      { targetAudience: 'ALL_USERS' },
      { 'deliveredTo.userId': user.authId },
    ],
    'deliveredTo.openedAt': { $exists: false },
  })

  const data: any = {
    result,
    unreadCount,
  }

  return data
}

// read notifications only for user
const readNotificationToDB = async (
  user: JwtPayload,
): Promise<INotification | undefined> => {
  console.log({ user })
  // Mark notifications as opened for this user
  const result: any = await Notification.updateMany(
    {
      'deliveredTo.userId': user.authId,
      'deliveredTo.openedAt': { $exists: false },
    },
    { $set: { 'deliveredTo.$[elem].openedAt': new Date() } },
    { arrayFilters: [{ 'elem.userId': user.authId }] },
  )
  return result
}

// get notifications for admin
const adminNotificationFromDB = async () => {
  const result = await Notification.find({
    $or: [{ targetAudience: 'ALL_USERS' }, { type: 'BROADCAST' }],
  })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email')
  return result
}

// read notifications only for admin
const adminReadNotificationToDB = async (): Promise<INotification | null> => {
  // Mark all broadcast notifications as read
  const result: any = await Notification.updateMany(
    { type: 'BROADCAST', isSent: true },
    { $set: { 'deliveredTo.$[].openedAt': new Date() } },
  )
  return result
}
// Create broadcast notification
const createBroadcastNotification = async (
  payload: Partial<INotification>,
): Promise<INotification> => {
  const notificationData: Partial<INotification> = {
    title: payload.title,
    message: payload.message,
    notificationType: payload.notificationType,
    targetAudience: payload.targetAudience,
    scheduled: payload.scheduled,
    sender: payload.sender,
    type: 'BROADCAST',
    isSent: !payload.scheduled,
  }

  if (payload.scheduled) {
    notificationData.scheduledDate = payload.scheduledDate
    notificationData.scheduledTime = payload.scheduledTime
    notificationData.isSent = false
  } else {
    notificationData.sentAt = new Date()

    // Get total user count for analytics
    const totalUsers = await User.countDocuments({ status: 'ACTIVE' })
    notificationData.sentCount = totalUsers
  }

  const result = await Notification.create(notificationData)

  // Send immediately if not scheduled
  if (!payload.scheduled) {
    //@ts-ignore
    const socketIo = global.io
    if (socketIo) {
      sendSocketNotification(socketIo, result)
      console.log(`📢 Broadcast sent to online users`)
    }
  }

  return result
}

// Get notification history with all tracking data
const getNotificationHistory = async (
  user?: JwtPayload,
  trackingData?: {
    notificationId: string
    opened?: boolean
    clicked?: boolean
  },
): Promise<any> => {
  // If tracking data provided, update it first
  if (trackingData && user) {
    const notification = await Notification.findById(
      trackingData.notificationId,
    )
    if (notification) {
      const deliveryIndex = notification.deliveredTo.findIndex(
        (delivery: any) => delivery.userId.toString() === user.authId,
      )

      if (deliveryIndex === -1) {
        notification.deliveredTo.push({
          userId: user.authId,
          deliveredAt: new Date(),
          openedAt: trackingData.opened ? new Date() : undefined,
          clickedAt: trackingData.clicked ? new Date() : undefined,
        })
      } else {
        if (trackingData.opened) {
          notification.deliveredTo[deliveryIndex].openedAt = new Date()
        }
        if (trackingData.clicked) {
          notification.deliveredTo[deliveryIndex].clickedAt = new Date()
        }
      }

      if (trackingData.opened) {
        notification.openCount += 1
        notification.openRate = Math.round(
          (notification.openCount / notification.sentCount) * 100,
        )
      }

      if (trackingData.clicked) {
        notification.clickCount += 1
        notification.engagement = Math.round(
          (notification.clickCount / notification.sentCount) * 100,
        )
      }

      await notification.save()
    }
  }

  // Return all notifications with tracking data
  const result = await Notification.find({ type: 'BROADCAST' })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email')
    .populate('deliveredTo.userId', 'name email')
    .lean()

  return result
}

// Send scheduled notifications
const sendScheduledNotifications = async (): Promise<void> => {
  const now = new Date()
  const scheduledNotifications = await Notification.find({
    scheduled: true,
    isSent: false,
    scheduledDate: { $lte: now },
  })

  for (const notification of scheduledNotifications) {
    //@ts-ignore
    const socketIo = global.io
    if (socketIo) {
      sendSocketNotification(socketIo, notification)
    }

    notification.isSent = true
    notification.sentAt = new Date()
    await notification.save()
  }
}

// Track notification open and engagement combined
const trackNotification = async (
  user: JwtPayload,
  notificationId: string,
  trackingData?: { opened?: boolean; clicked?: boolean },
): Promise<any> => {
  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new Error('Notification not found')
  }

  // Update delivery tracking
  const deliveryIndex = notification.deliveredTo.findIndex(
    (delivery: any) => delivery.userId.toString() === user.authId,
  )

  if (deliveryIndex === -1) {
    // First time delivery
    notification.deliveredTo.push({
      userId: user.authId,
      deliveredAt: new Date(),
      openedAt: trackingData?.opened ? new Date() : undefined,
      clickedAt: trackingData?.clicked ? new Date() : undefined,
    })
  } else {
    // Update existing delivery
    if (trackingData?.opened) {
      notification.deliveredTo[deliveryIndex].openedAt = new Date()
    }
    if (trackingData?.clicked) {
      notification.deliveredTo[deliveryIndex].clickedAt = new Date()
    }
  }

  // Update analytics
  if (trackingData?.opened) {
    notification.openCount += 1
    notification.openRate = Math.round(
      (notification.openCount / notification.sentCount) * 100,
    )
  }

  if (trackingData?.clicked) {
    notification.clickCount += 1
    notification.engagement = Math.round(
      (notification.clickCount / notification.sentCount) * 100,
    )
  }

  await notification.save()

  return {
    success: true,
    message: 'Tracking updated successfully',
    data: {
      notificationId,
      openedAt: trackingData?.opened ? new Date() : undefined,
      clickedAt: trackingData?.clicked ? new Date() : undefined,
      openCount: notification.openCount,
      engagement: notification.engagement,
      openRate: notification.openRate,
    },
  }
}

// Track notification open
const trackNotificationOpen = async (
  user: JwtPayload,
  notificationId: string,
): Promise<any> => {
  return trackNotification(user, notificationId, { opened: true })
}

// Track notification engagement
const trackNotificationEngagement = async (
  user: JwtPayload,
  notificationId: string,
): Promise<any> => {
  return trackNotification(user, notificationId, { clicked: true })
}

export const NotificationService = {
  adminNotificationFromDB,
  getNotificationFromDB,
  readNotificationToDB,
  adminReadNotificationToDB,
  createBroadcastNotification,
  getNotificationHistory,
  sendScheduledNotifications,
  trackNotificationOpen,
  trackNotificationEngagement,
}
