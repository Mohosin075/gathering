// models/Share.model.ts
import { Schema, model } from 'mongoose'
import { IShare } from './share.interface'

const ShareSchema = new Schema<IShare>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    caption: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Ensure one share per user per post
ShareSchema.index({ userId: 1, postId: 1 }, { unique: true })
ShareSchema.index({ postId: 1, createdAt: -1 })

export const Share = model<IShare>('Share', ShareSchema)
