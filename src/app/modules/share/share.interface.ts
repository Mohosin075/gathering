import { Types } from 'mongoose'

export interface IShare extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
  caption?: string
  createdAt: Date
  updatedAt: Date
}
