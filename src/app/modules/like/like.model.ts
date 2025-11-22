// models/Like.model.ts
import { Schema, Types, model } from 'mongoose'
import { ILike, LikeModel } from './like.interface'

const LikeSchema = new Schema<ILike>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetType',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Compound index to ensure one like per user per target
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true })

// Index for efficient queries
LikeSchema.index({ targetId: 1, targetType: 1 })
LikeSchema.index({ createdAt: -1 })

// Static method to check if user liked a target
LikeSchema.statics.isLiked = async function (
  userId: Types.ObjectId,
  targetId: Types.ObjectId,
  targetType: 'post' | 'comment',
): Promise<boolean> {
  const like = await this.findOne({ userId, targetId, targetType })
  return !!like
}

// Static method to get likes count for a target
LikeSchema.statics.getLikesCount = async function (
  targetId: Types.ObjectId,
  targetType: 'post' | 'comment',
): Promise<number> {
  return await this.countDocuments({ targetId, targetType })
}

// Static method to toggle like
LikeSchema.statics.toggleLike = async function (
  userId: Types.ObjectId,
  targetId: Types.ObjectId,
  targetType: 'post' | 'comment',
): Promise<{ liked: boolean; like: ILike | null }> {
  const existingLike = await this.findOne({ userId, targetId, targetType })

  if (existingLike) {
    await this.deleteOne({ _id: existingLike._id })
    return { liked: false, like: null }
  } else {
    const like = await this.create({ userId, targetId, targetType })
    return { liked: true, like }
  }
}

export const Like = model<ILike, LikeModel>('Like', LikeSchema)
