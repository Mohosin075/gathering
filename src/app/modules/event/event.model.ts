import { Schema, model } from 'mongoose'
import { IEvent, EventModel } from './event.interface'

const eventSchema = new Schema<IEvent, EventModel>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'archived'],
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
    },
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    timezone: { type: String, required: true },
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
    bannerImage: { type: String },
    gallery: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
)

export const Event = model<IEvent, EventModel>('Event', eventSchema)
