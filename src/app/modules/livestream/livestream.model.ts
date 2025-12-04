import { model, Schema, Types } from 'mongoose'
import { ILiveStream, LiveStreamModel } from './livestream.interface'

const liveStreamSchema = new Schema<ILiveStream, LiveStreamModel>(
  {
    // Core References
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    streamer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Basic Info
    title: { type: String, required: true },
    description: { type: String },

    // Technical Stream Details
    channelName: { type: String, required: true, unique: true },
    streamKey: { type: String },
    streamId: { type: String, unique: true },

    // Streaming URLs
    rtmpPushUrl: { type: String },
    rtmpPullUrl: { type: String },
    hlsUrl: { type: String },
    playbackUrl: { type: String },

    // Stream Configuration
    streamType: {
      type: String,
      enum: ['public', 'private', 'ticketed'],
      default: 'public',
      required: true,
    },
    streamingMode: {
      type: String,
      enum: ['communication', 'live'],
      default: 'live',
      required: true,
    },
    maxViewers: { type: Number, default: 10000 },

    // Stream Status & Timing
    streamStatus: {
      type: String,
      enum: ['scheduled', 'starting', 'live', 'ended', 'cancelled'],
      default: 'scheduled',
      required: true,
    },
    isLive: { type: Boolean, default: false },
    liveStartedAt: { type: Date },
    liveEndedAt: { type: Date },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },

    // Viewers & Analytics
    currentViewers: { type: Number, default: 0 },
    totalViewers: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    totalViewTime: { type: Number, default: 0 },

    // Features
    chatEnabled: { type: Boolean, default: true },
    chatId: { type: String },
    isRecorded: { type: Boolean, default: false },
    recordingUrl: { type: String },
    thumbnail: { type: String },

    // Monetization & Access Control
    isPaid: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    streamPassword: { type: String },
    allowedEmails: [{ type: String }],

    isActive: { type: Boolean, default: false },
    isUpcoming: { type: Boolean, default: false },

    // Metadata
    tags: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.streamKey
        delete ret.__v
        return ret
      },
    },
    toObject: {
      virtuals: true,
    },
  },
)

// Indexes
liveStreamSchema.index({ event: 1, streamStatus: 1 })
liveStreamSchema.index({ streamer: 1, createdAt: -1 })
liveStreamSchema.index({ isLive: 1 })
liveStreamSchema.index({ streamType: 1 })
liveStreamSchema.index({ tags: 1 })
liveStreamSchema.index({ scheduledStartTime: 1, streamStatus: 1 })

// Virtuals
liveStreamSchema.virtual('duration').get(function () {
  if (this.liveStartedAt && this.liveEndedAt) {
    return this.liveEndedAt.getTime() - this.liveStartedAt.getTime()
  }
  return 0
})

// Virtuals - FIXED VERSION
// liveStreamSchema.virtual('isUpcoming').get(function () {
//   const now = new Date()
//   return (
//     this.streamStatus === 'scheduled' &&
//     this.scheduledStartTime &&
//     this.scheduledStartTime > now
//   )
// })

// // FIXED: Simplified logic for isActive
// liveStreamSchema.virtual('isActive').get(function () {
//   // Active when stream status is 'starting' or 'live'
//   return this.streamStatus === 'starting' || this.streamStatus === 'live'
// })

// liveStreamSchema.virtual('isActive').get(function () {
//   const now = new Date()
//   return (
//     this.isLive ||
//     (this.streamStatus === 'live' &&
//       this.scheduledStartTime &&
//       this.scheduledEndTime &&
//       now >= this.scheduledStartTime &&
//       now <= this.scheduledEndTime)
//   )
// })

// Static Methods
liveStreamSchema.statics.canViewStream = async function (
  streamId: string,
  userId?: string,
): Promise<boolean> {
  const stream = await this.findById(streamId).lean()
  if (!stream) return false

  // Public streams - anyone can view
  if (stream.streamType === 'public') return true

  // Need user ID for private/ticketed streams
  if (!userId) return false

  // Check if user is streamer
  if (String(stream.streamer) === userId) return true

  // Private streams - check allowed emails
  if (stream.streamType === 'private') {
    const user = await (this as any).db
      .model('User')
      .findById(userId)
      .select('email')
    if (user && stream.allowedEmails?.includes(user.email)) {
      return true
    }
    return false
  }

  // Ticketed streams - check payment
  if (stream.streamType === 'ticketed') {
    // Implementation depends on your ticket/payment system
    // You need to implement this based on your business logic
    return false
  }

  return false
}

liveStreamSchema.statics.canBroadcast = async function (
  streamId: string,
  userId: string,
): Promise<boolean> {
  const stream = await this.findById(streamId).lean()
  if (!stream) return false
  return String(stream.streamer) === userId
}

// Pre-save middleware
liveStreamSchema.pre('save', async function (next) {
  if (this.isNew) {
    // Generate unique channel name
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    this.channelName = `stream_${timestamp}_${randomStr}`

    // Generate secure stream key
    const crypto = await import('crypto')
    this.streamKey = crypto.randomBytes(32).toString('hex').substring(0, 32)

    // Generate stream ID
    this.streamId = `agora_${timestamp}_${Math.random()
      .toString(36)
      .substring(2, 10)}`
  }

  // Update isLive based on streamStatus
  if (this.streamStatus === 'live') {
    this.isLive = true
    if (!this.liveStartedAt) {
      this.liveStartedAt = new Date()
    }
  } else if (
    this.streamStatus === 'ended' ||
    this.streamStatus === 'cancelled'
  ) {
    this.isLive = false
    if (!this.liveEndedAt) {
      this.liveEndedAt = new Date()
    }
  }

  next()
})

export const LiveStream = model<ILiveStream, LiveStreamModel>(
  'LiveStream',
  liveStreamSchema,
)
