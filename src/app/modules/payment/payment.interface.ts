import { Model, Types } from 'mongoose'

export interface IPaymentFilterables {
  searchTerm?: string
  ticketId?: string
  userId?: string
  eventId?: string
  paymentMethod?: string
  status?: string
}

export interface IPayment {
  _id: Types.ObjectId
  ticketId: Types.ObjectId
  userId: Types.ObjectId
  userEmail: string
  eventId: Types.ObjectId
  amount: number
  currency: string
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer'
  paymentIntentId: string
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  refundAmount?: number
  refundReason?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export type PaymentModel = Model<IPayment, {}, {}>
