  import { model, Schema } from 'mongoose'
  import { INotification, NotificationModel } from './notification.interface'

  const notificationSchema = new Schema<INotification, NotificationModel>(
    {
      title: { type: String, required: true },
      message: { type: String, required: true },
      notificationType: {
        type: String,
        enum: ['EVENT_ALERT', 'SYSTEM_ALERT', 'PROMOTIONAL'],
        default: 'SYSTEM_ALERT',
      },
      targetAudience: {
        type: String,
        enum: ['ALL_USERS', 'SPECIFIC_USERS', 'USER_GROUP'],
        default: 'ALL_USERS',
      },

      // Analytics & Tracking
      openRate: { type: Number, default: 0 }, // % of users who opened
      engagement: { type: Number, default: 0 }, // % of users who interacted
      sentCount: { type: Number, default: 0 }, // Total users sent to
      openCount: { type: Number, default: 0 }, // Users who opened
      clickCount: { type: Number, default: 0 }, // Users who clicked/engaged

      // Delivery tracking
      deliveredTo: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User' },
          deliveredAt: Date,
          openedAt: Date,
          clickedAt: Date,
        },
      ],

      // Scheduling
      scheduled: { type: Boolean, default: false },
      scheduledDate: Date,
      scheduledTime: String,
      isSent: { type: Boolean, default: false },
      sentAt: Date,

      sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      type: {
        type: String,
        enum: ['BROADCAST', 'INDIVIDUAL'],
        default: 'BROADCAST',
      },
    },
    { timestamps: true },
  )

  export const Notification = model<INotification, NotificationModel>(
    'Notification',
    notificationSchema,
  )
