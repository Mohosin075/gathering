import { Schema, model } from 'mongoose'
import { IBooking, BookingModel } from './booking.interface'

const bookingSchema = new Schema<IBooking, BookingModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },

    address: {
      address: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
    },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0], // [longitude, latitude]
      },
    },

    serviceType: {
      title: { type: String, required: true },
      description: { type: String },
    },

    serviceDetails: [
      {
        name: { type: String, required: true },
        value: { type: Schema.Types.Mixed }, // can be string | number | boolean
      },
    ],

    notes: { type: String },

    status: {
      type: String,
      enum: [
        'confirmed',
        'inProgress',
        'completed',
        'cancelled',
        'requested',
        'scheduled',
      ],
      default: 'requested',
    },
  },
  {
    timestamps: true,
  },
)

export const Booking = model<IBooking, BookingModel>('Booking', bookingSchema)
