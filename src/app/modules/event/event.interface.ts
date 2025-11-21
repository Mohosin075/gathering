import { Model, Types } from 'mongoose'
import { Point } from '../user/user.interface'

export interface IEventFilterables {
  searchTerm?: string
  title?: string
  description?: string
  category?: string
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
  timezone?: string
  meetingLink?: string
  currency?: string
  bannerImage?: string
}

export interface IEvent {
  _id: Types.ObjectId
  title: string
  description: string
  category: string
  tags: string[]
  organizerId: Types.ObjectId
  status: 'draft' | 'published' | 'cancelled' | 'archived'
  visibility: 'public' | 'private' | 'unlisted'
  startDate: string
  startTime: string
  timezone: string
  locationType: 'physical' | 'online'
  location: Point
  address: string

  meetingLink?: string
  capacity: number
  ticketsSold?: number
  ticketPrice: number
  bannerImage?: string
  gallery: string[]
  views?: number
  favorites?: number
}

export type EventModel = Model<IEvent, {}, {}>
