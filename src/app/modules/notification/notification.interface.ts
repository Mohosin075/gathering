import { Model, Types } from 'mongoose'
import {
  NOTIFICATION_CATEGORY,
  TARGET_AUDIENCE,
} from '../../../enum/notification'

export type INotification = {
  sender?: Types.ObjectId
  receiver?: Types.ObjectId
  title?: string
  text: string
  read: boolean
  direction?: string
  link?: string
  type?: 'ADMIN' // not focus and changes this

  // for gathering
  notificationCategory?: NOTIFICATION_CATEGORY
  targetAudience?: TARGET_AUDIENCE
  schedule?: boolean
  scheduleDate?: Date
  scheduleTime?: string
}

export type NotificationModel = Model<INotification>
