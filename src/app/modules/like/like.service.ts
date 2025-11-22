// services/like.service.ts
import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
import { ILike } from './like.interface'
import ApiError from '../../../errors/ApiError'
import { Post } from '../post/post.model'
import { Like } from './like.model'
import { Comment } from '../comment/comment.model'

const toggleLike = async (
  userId: Types.ObjectId,
  targetId: string,
  targetType: 'post' | 'comment',
): Promise<{ liked: boolean; like: ILike | null }> => {
  if (!Types.ObjectId.isValid(targetId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${targetType} ID`)
  }

  // Check if target exists
  if (targetType === 'post') {
    const post = await Post.findById(targetId)
    if (!post) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found')
    }
  } else {
    const comment = await Comment.findById(targetId)
    if (!comment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found')
    }
  }

  const result = await Like.toggleLike(
    userId,
    new Types.ObjectId(targetId),
    targetType,
  )

  // Update like count in target document
  if (targetType === 'post') {
    await Post.findByIdAndUpdate(targetId, {
      'metadata.likeCount': await Like.getLikesCount(
        new Types.ObjectId(targetId),
        targetType,
      ),
    })
  } else {
    await Comment.findByIdAndUpdate(targetId, {
      'metadata.likeCount': await Like.getLikesCount(
        new Types.ObjectId(targetId),
        targetType,
      ),
    })
  }

  return result
}

const getLikes = async (
  targetId: string,
  targetType: 'post' | 'comment',
): Promise<{ likes: ILike[]; total: number }> => {
  if (!Types.ObjectId.isValid(targetId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${targetType} ID`)
  }

  const likes = await Like.find({
    targetId: new Types.ObjectId(targetId),
    targetType,
  })
    .populate('userId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })

  const total = await Like.getLikesCount(
    new Types.ObjectId(targetId),
    targetType,
  )

  return {
    likes,
    total,
  }
}

const checkLikeStatus = async (
  userId: Types.ObjectId,
  targetId: string,
  targetType: 'post' | 'comment',
): Promise<{ isLiked: boolean }> => {
  if (!Types.ObjectId.isValid(targetId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${targetType} ID`)
  }

  const isLiked = await Like.isLiked(
    userId,
    new Types.ObjectId(targetId),
    targetType,
  )

  return { isLiked }
}

export const LikeServices = {
  toggleLike,
  getLikes,
  checkLikeStatus,
}
