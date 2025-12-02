import { Model, Types } from 'mongoose'
import { SavedEventFilterType } from './savedEvent.constants'

export interface ISavedEvent {
  _id: Types.ObjectId
  user: Types.ObjectId
  event: Types.ObjectId
  savedAt: Date
  notifyBefore?: boolean
  notifyReminder?: boolean
}

export interface ISavedEventFilterables {
  searchTerm?: string
  filter?: SavedEventFilterType // Add filter type
  user?: string
  event?: string
  savedAt?: string
  notifyBefore?: boolean
  notifyReminder?: boolean
}

export type SavedEventModel = Model<ISavedEvent, {}, {}>
