import { INotification } from '../app/modules/notification/notification.interface'
import { Notification } from '../app/modules/notification/notification.model'
import { User } from '../app/modules/user/user.model'

export const sendNotifications = async (data: any): Promise<INotification> => {
  const result = await Notification.create(data)

  //@ts-ignore
  const socketIo = global.io

  if (socketIo) {
    if (data.receiver) {
      // Single user notification
      socketIo.emit(`getNotification::${data.receiver}`, result)
    } else if (data.targetAudience === 'ALL_USERS') {
      // Broadcast to all users
      socketIo.emit('broadcastNotification', result)
    }
  }

  return result
}



