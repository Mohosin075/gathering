import { model, Schema } from 'mongoose';
import { INotification, NotificationModel } from './notification.interface';

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
      required: false
    },
    link: {
      type: String,
      required: false
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
      enum: ["ADMIN"],
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

export const Notification = model<INotification, NotificationModel>(
  'Notification',
  notificationSchema
);
