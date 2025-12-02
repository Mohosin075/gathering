import { Model, Types } from 'mongoose'

export interface IAttendeeFilterables {
  searchTerm?: string
  eventId?: string
  userId?: string
  ticketId?: string
  checkInStatus?: boolean
  isVerified?: boolean
}

export interface IAttendee {
  _id: Types.ObjectId
  eventId: Types.ObjectId
  userId: Types.ObjectId
  ticketId: Types.ObjectId
  paymentId: Types.ObjectId
  registrationDate: Date
  checkInStatus: boolean
  checkInTime?: Date
  checkInBy?: Types.ObjectId
  specialRequirements?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export type AttendeeModel = Model<IAttendee, {}, {}>
