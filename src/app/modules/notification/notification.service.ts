import { JwtPayload } from 'jsonwebtoken'
import { INotification } from './notification.interface'
import { Notification } from './notification.model'
import { sendSocketNotification } from '../../../helpers/socketHelper'
import { User } from '../user/user.model'

// get notifications
const getNotificationFromDB = async (
  user: JwtPayload,
): Promise<INotification> => {
  const result = await Notification.find({ receiver: user.authId }).select(
    'title text read direction link createdAt',
  )

  const unreadCount = await Notification.countDocuments({
    receiver: user.authId,
    read: false,
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
  const result: any = await Notification.updateMany(
    { receiver: user.authId, read: false },
    { $set: { read: true } },
  )
  return result
}

// get notifications for admin
const adminNotificationFromDB = async () => {
  const result = await Notification.find({ type: 'ADMIN' })
  return result
}

// read notifications only for admin
const adminReadNotificationToDB = async (): Promise<INotification | null> => {
  const result: any = await Notification.updateMany(
    { type: 'ADMIN', read: false },
    { $set: { read: true } },
    { new: true },
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

// Get notification history
const getNotificationHistory = async (): Promise<any> => {
  const result = await Notification.find({ type: 'BROADCAST' })
    .sort({ createdAt: -1 })
    .populate('sender', 'name email')
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
      socketIo.emit('broadcastNotification', notification)
    }

    notification.isSent = true
    notification.sentAt = new Date()
    await notification.save()
  }
}

// Track notification open
const trackNotificationOpen = async (
  user: JwtPayload,
  notificationId: string,
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
      openedAt: new Date(),
    })
  } else {
    // Update existing delivery
    notification.deliveredTo[deliveryIndex].openedAt = new Date()
  }

  // Update analytics
  notification.openCount += 1
  notification.openRate = Math.round(
    (notification.openCount / notification.sentCount) * 100,
  )

  await notification.save()

  return { success: true, message: 'Open tracked successfully' }
}

// Track notification engagement
const trackNotificationEngagement = async (
  user: JwtPayload,
  notificationId: string,
): Promise<any> => {
  const notification = await Notification.findById(notificationId)
  if (!notification) {
    throw new Error('Notification not found')
  }

  // Update engagement tracking
  const deliveryIndex = notification.deliveredTo.findIndex(
    (delivery: any) => delivery.userId.toString() === user.authId,
  )

  if (deliveryIndex !== -1) {
    notification.deliveredTo[deliveryIndex].clickedAt = new Date()
  }

  // Update analytics
  notification.clickCount += 1
  notification.engagement = Math.round(
    (notification.clickCount / notification.sentCount) * 100,
  )

  await notification.save()

  return { success: true, message: 'Engagement tracked successfully' }
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
