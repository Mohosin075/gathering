import { Schema, model } from 'mongoose'
import { IAttendee, AttendeeModel } from './attendee.interface'

const attendeeSchema = new Schema<IAttendee, AttendeeModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
      unique: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      index: true,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    checkInStatus: {
      type: Boolean,
      default: false,
    },
    checkInTime: {
      type: Date,
    },
    checkInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    specialRequirements: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

attendeeSchema.index({ eventId: 1, userId: 1 })
attendeeSchema.index({ checkInStatus: 1 })
attendeeSchema.index({ eventId: 1, checkInStatus: 1 })

export const Attendee = model<IAttendee, AttendeeModel>(
  'Attendee',
  attendeeSchema,
)
