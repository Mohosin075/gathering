import { model, Schema, Types } from 'mongoose'
import { IMeeting } from './meeting.interface'

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meetingType: {
      type: String,
      enum: ['scheduled', 'instant'],
      required: true,
      default: 'instant',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    roomId: { type: String, required: true },
    joinLink: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
  },
  { timestamps: true },
)

meetingSchema.statics.isAuthorized = async function (
  meetingId: string,
  userId: string,
) {
  const meeting = await Meeting.findById(meetingId).select(
    'creator participant',
  )
  if (!meeting) return false
  return (
    String(meeting.creator) === String(userId) ||
    String(meeting.participant) === String(userId)
  )
}

export const Meeting = model<IMeeting>('Meeting', meetingSchema)
