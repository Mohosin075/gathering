import { Schema, model } from 'mongoose'
import { IEvent, EventModel } from './event.interface'
import { EVENT_CATEGORIES, EVENT_STATUS } from '../../../enum/event'

const eventSchema = new Schema<IEvent, EventModel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    tags: { type: [String], default: [] },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: EVENT_STATUS,
      default: EVENT_STATUS.PENDING,
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    timezone: { type: String },
    locationType: {
      type: String,
      enum: ['physical', 'online'],
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    address: { type: String, required: true },
    meetingLink: { type: String },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    ticketPrice: { type: Number, required: true },
    images: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },

    // Live Stream Reference
    hasLiveStream: {
      type: Boolean,
      default: false,
    },
    liveStreamId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveStream',
      default: null,
    },
    isStreamingActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true, transform: sanitizeOrganizer },
    toObject: { virtuals: true, transform: sanitizeOrganizer },
    timestamps: true,
  },
)

// Transform function to sanitize populated organizer fields

function sanitizeOrganizer(doc: any, ret: any) {
  if (ret.organizerId && typeof ret.organizerId === 'object') {
    // Keep only safe fields
    ret.organizerId = {
      _id: ret.organizerId._id,
      name: ret.organizerId.name,
      email: ret.organizerId.email,
      role: ret.organizerId.role,
      timezone: ret.organizerId.timezone,
      profile: ret.organizerId.profile,
    }
  }
  return ret
}

export const Event = model<IEvent, EventModel>('Event', eventSchema)
