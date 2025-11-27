import { Schema, model } from 'mongoose';
import { ITicket, TicketModel } from './ticket.interface'; 

const ticketSchema = new Schema<ITicket, TicketModel>({
  _id: { type: Schema.Types.ObjectId }, required: true,
  eventId: { type: Schema.Types.ObjectId }, required: true,
  attendeeId: { type: Schema.Types.ObjectId }, required: true,
  ticketType: { type: String }, required: true,
  price: { type: Number }, required: true,
  quantity: { type: Number }, required: true,
  totalAmount: { type: Number }, required: true,
  promotionCode: { type: String },
  discountAmount: { type: Number }, required: true,
  finalAmount: { type: Number }, required: true,
  status: { type: String }, required: true,
  paymentStatus: { type: String }, required: true,
  qrCode: { type: String }, required: true,
  ticketNumber: { type: String }, required: true,
  checkedIn: { type: Boolean }, required: true,
  checkedInAt: { type: Date },
}, {
  timestamps: true
});

export const Ticket = model<ITicket, TicketModel>('Ticket', ticketSchema);
