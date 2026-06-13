import { Model, Types } from 'mongoose'

export interface IAttendance {
  user: Types.ObjectId
  event: Types.ObjectId
  status: 'going' | 'interested' | 'checked-in'
  checkedInAt?: Date
  rsvpAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export type AttendanceModel = Model<IAttendance, {}, {}>
