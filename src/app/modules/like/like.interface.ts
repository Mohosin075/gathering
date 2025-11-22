// interfaces/like.interface.ts
import { Document, Types, Model } from 'mongoose'

export interface ILike extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  targetType: 'post' | 'comment'
  targetId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface ILikePopulated extends Omit<ILike, 'userId'> {
  userId: {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    avatar?: string
  }
}

// Static methods for Like model
export interface LikeModel extends Model<ILike> {
  isLiked(
    userId: Types.ObjectId,
    targetId: Types.ObjectId,
    targetType: 'post' | 'comment',
  ): Promise<boolean>
  getLikesCount(
    targetId: Types.ObjectId,
    targetType: 'post' | 'comment',
  ): Promise<number>
  toggleLike(
    userId: Types.ObjectId,
    targetId: Types.ObjectId,
    targetType: 'post' | 'comment',
  ): Promise<{ liked: boolean; like: ILike | null }>
}
