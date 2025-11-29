import { INotification } from '../app/modules/notification/notification.interface'
import { Notification } from '../app/modules/notification/notification.model'
import { User } from '../app/modules/user/user.model'
import { sendSocketNotification } from './socketHelper'

export const sendNotifications = async (data: any): Promise<INotification> => {
  // Ensure required fields are present
  const notificationData: any = {
    title: data.title || 'Notification',
    message: data.message || data.text || '',
    notificationType: data.notificationType || 'SYSTEM_ALERT',
    sender: data.sender,
    type: data.type || 'BROADCAST',
  }

  // Handle receiver vs targetAudience
  if (data.receiver) {
    notificationData.targetAudience = 'SPECIFIC_USERS'
    notificationData.deliveredTo = [{ userId: data.receiver }]
  } else {
    notificationData.targetAudience = data.targetAudience || 'ALL_USERS'
  }

  if (data.scheduled) {
    notificationData.scheduled = true
    notificationData.scheduledDate = data.scheduledDate
    notificationData.scheduledTime = data.scheduledTime
    notificationData.isSent = false
  } else {
    notificationData.isSent = true
    notificationData.sentAt = new Date()
  }

  try {
    const result = await Notification.create(notificationData)

    // Send via socket if not scheduled
    if (!data.scheduled) {
      //@ts-ignore
      const socketIo = global.io
      if (socketIo) {
        sendSocketNotification(socketIo, result)
      }
    }

    return result
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
