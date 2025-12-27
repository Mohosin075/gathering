import { Model, Types } from 'mongoose'

export interface ITicketFilterables {
  searchTerm?: string
  eventId?: string
  attendeeId?: string
  ticketType?: string
  status?: string
  paymentStatus?: string
}

export interface ITicket {
  _id: Types.ObjectId
  eventId: Types.ObjectId
  attendeeId: Types.ObjectId
  userId: Types.ObjectId
  ticketType: 'regular' | 'vip' | 'early_bird'
  price: number
  quantity: number
  totalAmount: number
  promotionCode?: string
  discountAmount: number
  finalAmount: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  qrCode: string
  ticketNumber: string
  checkedIn: boolean
  checkedInAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type TicketModel = Model<ITicket, {}, {}>
