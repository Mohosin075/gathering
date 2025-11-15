import { Model, Types } from 'mongoose'

export interface IBookingFilterables {
  searchTerm?: string
  startTime?: string
  endTime?: string
  address?: string
  notes?: string
}

type BookingStatus =
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'requested'
  | 'scheduled'

export interface IBooking {
  _id: Types.ObjectId
  user: Types.ObjectId
  service: Types.ObjectId
  staff: Types.ObjectId
  date: Date
  startTime?: string
  endTime?: string
  address?: {
    address: string
    city?: string
    state?: string
    zipCode?: string
  }
  serviceType: {
    title: string
    description: string
  }
  serviceDetails: {
    name: string
    value?: string | number | boolean
  }[]
  notes?: string
  status?: BookingStatus
}

export type BookingModel = Model<IBooking, {}, {}>
