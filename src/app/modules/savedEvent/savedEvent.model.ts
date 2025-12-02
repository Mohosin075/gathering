import { Schema, model } from 'mongoose'
import { ISavedEvent, SavedEventModel } from './savedEvent.interface'

const savedEventSchema = new Schema<ISavedEvent, SavedEventModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    event: { type: Schema.Types.ObjectId, ref: 'Event' },
    savedAt: { type: Date, default: Date.now },
    notifyBefore: { type: Boolean, default: false },
    notifyReminder: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

export const SavedEvent = model<ISavedEvent, SavedEventModel>(
  'SavedEvent',
  savedEventSchema,
)
