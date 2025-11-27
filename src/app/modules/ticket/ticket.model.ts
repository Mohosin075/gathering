import { Schema, model, Types } from 'mongoose'
import { ITicket, TicketModel } from './ticket.interface'

const ticketSchema = new Schema<ITicket, TicketModel>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    attendeeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketType: {
      type: String,
      enum: ['regular', 'vip', 'early_bird'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    promotionCode: {
      type: String,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes
ticketSchema.index({ eventId: 1, attendeeId: 1 })
ticketSchema.index({ qrCode: 1 })
ticketSchema.index({ ticketNumber: 1 })
ticketSchema.index({ status: 1, paymentStatus: 1 })

export const Ticket = model<ITicket, TicketModel>('Ticket', ticketSchema)
