import { Schema, model } from 'mongoose'
import { AttendanceModel, IAttendance } from './attendance.interface'

const attendanceSchema = new Schema<IAttendance, AttendanceModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['going', 'interested', 'checked-in'],
      required: true,
    },
    checkedInAt: {
      type: Date,
    },
    rsvpAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

// Ensure unique attendance per user-event combination
attendanceSchema.index({ user: 1, event: 1 }, { unique: true })

export const Attendance = model<IAttendance, AttendanceModel>(
  'Attendance',
  attendanceSchema,
)
