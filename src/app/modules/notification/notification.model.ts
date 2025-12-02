import { model, Schema } from 'mongoose'
import { INotification, NotificationModel } from './notification.interface'
import {
  NOTIFICATION_CATEGORY,
  TARGET_AUDIENCE,
} from '../../../enum/notification'

const notificationSchema = new Schema<INotification, NotificationModel>(
  {
    text: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      required: false,
    },
    link: {
      type: String,
      required: false,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ['ADMIN'],
      required: false,
    },
    notificationCategory: {
      type: String,
      enum: NOTIFICATION_CATEGORY,
      default: NOTIFICATION_CATEGORY.GENERAL,
      required: false,
    },
    targetAudience: {
      type: String,
      enum: TARGET_AUDIENCE,
      default: TARGET_AUDIENCE.ALL_USER,
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  notificationSchema,
)
