import { Schema, model } from 'mongoose';
import { IUserevent, UsereventModel } from './userevent.interface'; 

const usereventSchema = new Schema<IUserevent, UsereventModel>({
  title: { type: String },
  description: { type: String },
  venueId: { type: Schema.Types.ObjectId, ref: 'Venue' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  startTime: { type: Date },
  vibeTags: { type: [String] },
  visibility: { type: Boolean, default: true },
  goingCount: { type: Number, default: 0 },
  location: { type: Schema.Types.Mixed },
  address: { type: String },
  images: { type: [String], default: [] },
}, {
  timestamps: true
});

export const Userevent = model<IUserevent, UsereventModel>('Userevent', usereventSchema);
