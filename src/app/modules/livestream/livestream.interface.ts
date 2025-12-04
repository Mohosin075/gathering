import { Document, Types, Model } from 'mongoose'

// Main LiveStream Document Interface
export interface ILiveStream extends Document {
  // Core References
  event: Types.ObjectId
  streamer: Types.ObjectId

  // Basic Info
  title: string
  description?: string

  // Technical Stream Details
  channelName: string
  streamKey: string
  streamId?: string

  // Streaming URLs
  rtmpPushUrl?: string
  rtmpPullUrl?: string
  hlsUrl?: string
  playbackUrl?: string

  // Stream Configuration
  streamType: 'public' | 'private' | 'ticketed'
  streamingMode: 'communication' | 'live'
  maxViewers: number

  // Stream Status & Timing
  streamStatus: 'scheduled' | 'starting' | 'live' | 'ended' | 'cancelled'
  isLive: boolean
  liveStartedAt?: Date
  liveEndedAt?: Date
  scheduledStartTime?: Date
  scheduledEndTime?: Date

  // Viewers & Analytics
  currentViewers: number
  totalViewers: number
  peakViewers: number
  totalViewTime: number

  // Features
  chatEnabled: boolean
  chatId?: string
  isRecorded: boolean
  recordingUrl?: string
  thumbnail?: string

  // Monetization & Access Control
  isPaid: boolean
  requiresApproval: boolean
  streamPassword?: string
  allowedEmails: string[]

  // Metadata
  tags: string[]

  // Timestamps (from Mongoose)
  createdAt: Date
  updatedAt: Date
}

// LiveStream Model Static Methods Interface
export interface LiveStreamModel extends Model<ILiveStream> {
  canViewStream(streamId: string, userId?: string): Promise<boolean>
  canBroadcast(streamId: string, userId: string): Promise<boolean>
}

// DTOs (Data Transfer Objects) for Request/Response

// Create Live Stream Request DTO
export interface ICreateLiveStreamDTO {
  eventId: string
  title: string
  description?: string
  streamType: 'public' | 'private' | 'ticketed'
  scheduledStartTime?: string
  scheduledEndTime?: string
  maxViewers?: number
  chatEnabled?: boolean
  isRecorded?: boolean
  requiresApproval?: boolean
  streamPassword?: string
  allowedEmails?: string[]
  tags?: string[]
}

// Update Live Stream Request DTO
export interface IUpdateLiveStreamDTO {
  title?: string
  description?: string
  streamType?: 'public' | 'private' | 'ticketed'
  scheduledStartTime?: string
  scheduledEndTime?: string
  maxViewers?: number
  chatEnabled?: boolean
  isRecorded?: boolean
  requiresApproval?: boolean
  streamPassword?: string
  allowedEmails?: string[]
  tags?: string[]
  thumbnail?: string
}

// Join Stream Request DTO
export interface IJoinStreamRequestDTO {
  streamId: string
  password?: string
  role: 'viewer' | 'broadcaster'
}

// Agora Token Response DTO
export interface IAgoraTokenResponseDTO {
  token: string
  channelName: string
  uid: number
  role: 'publisher' | 'subscriber'
  expireTime: number
  streamingMode: 'communication' | 'live'
}

// Live Stream Response DTO (for API responses)
export interface ILiveStreamResponseDTO {
  id: string
  event: {
    id: string
    title: string
    description: string
  }
  streamer: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  title: string
  description?: string
  channelName: string
  streamStatus: 'scheduled' | 'starting' | 'live' | 'ended' | 'cancelled'
  isLive: boolean
  currentViewers: number
  maxViewers: number
  streamType: 'public' | 'private' | 'ticketed'
  chatEnabled: boolean
  thumbnail?: string
  playbackUrl?: string
  hlsUrl?: string
  scheduledStartTime?: Date
  liveStartedAt?: Date
  createdAt: Date
  updatedAt: Date
  isUpcoming: boolean
  isActive: boolean
  requiresApproval: boolean
  tags: string[]
  
}

// Stream Statistics DTO
export interface IStreamStatisticsDTO {
  streamId: string
  title: string
  totalViewers: number
  peakViewers: number
  averageWatchTime: number
  totalViewTime: number
  joinedUsers: number
  leftUsers: number
  startTime: Date
  endTime?: Date
  duration: number
  streamStatus: string
}

// Agora Webhook Event DTO
export interface IAgoraWebhookEventDTO {
  event: 'user_joined' | 'user_left' | 'stream_published' | 'stream_unpublished'
  channel: string
  uid: string
  timestamp: number
  streamId?: string
}

// Stream List Query DTO
export interface IStreamListQueryDTO {
  page?: number
  limit?: number
  search?: string
  streamType?: 'public' | 'private' | 'ticketed'
  streamStatus?: 'scheduled' | 'live' | 'ended'
  isLive?: boolean
  tags?: string[]
  sortBy?: 'createdAt' | 'scheduledStartTime' | 'currentViewers'
  sortOrder?: 'asc' | 'desc'
}

// Stream Update Status DTO
export interface IStreamStatusUpdateDTO {
  streamId: string
  status: 'starting' | 'live' | 'ended' | 'cancelled'
  reason?: string
}

// Stream Viewer Update DTO (for webhooks)
export interface IStreamViewerUpdateDTO {
  streamId: string
  channelName: string
  action: 'join' | 'leave'
  uid: string
  timestamp: number
}

// Paginated Response Wrapper
export interface IPaginatedResponse<T> {
  success: boolean
  statusCode: number
  message: string
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  data: T[]
}

export interface ILiveStreamWithVirtuals extends ILiveStream {
  isUpcoming: boolean
  isActive: boolean
  duration: number
}
