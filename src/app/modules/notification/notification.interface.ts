// notification.interface.ts
import { Document, Model, Types } from 'mongoose'

export interface IDeliveryTracking {
  userId: Types.ObjectId
  deliveredAt?: Date
  openedAt?: Date
  clickedAt?: Date
}

export interface INotification extends Document {
  title: string
  message: string
  notificationType: 'EVENT_ALERT' | 'SYSTEM_ALERT' | 'PROMOTIONAL'
  targetAudience: 'ALL_USERS' | 'SPECIFIC_USERS' | 'USER_GROUP'
  openRate: number
  engagement: number
  sentCount: number
  openCount: number
  clickCount: number
  deliveredTo: IDeliveryTracking[]
  scheduled: boolean
  scheduledDate?: Date
  scheduledTime?: string
  isSent: boolean
  sentAt?: Date
  sender: Types.ObjectId
  type: 'BROADCAST' | 'INDIVIDUAL'
  createdAt: Date
  updatedAt: Date
}

export interface NotificationModel extends Model<INotification> {
  // Add static methods here if needed
}

export interface ICreateNotification {
  title: string
  message: string
  notificationType?: 'EVENT_ALERT' | 'SYSTEM_ALERT' | 'PROMOTIONAL'
  targetAudience?: 'ALL_USERS' | 'SPECIFIC_USERS' | 'USER_GROUP'
  scheduled?: boolean
  scheduledDate?: Date
  scheduledTime?: string
  sender: Types.ObjectId | string
  type?: 'BROADCAST' | 'INDIVIDUAL'
}

export interface IUpdateNotification {
  title?: string
  message?: string
  notificationType?: 'EVENT_ALERT' | 'SYSTEM_ALERT' | 'PROMOTIONAL'
  targetAudience?: 'ALL_USERS' | 'SPECIFIC_USERS' | 'USER_GROUP'
  openRate?: number
  engagement?: number
  sentCount?: number
  openCount?: number
  clickCount?: number
  scheduled?: boolean
  scheduledDate?: Date
  scheduledTime?: string
  isSent?: boolean
  sentAt?: Date
}
