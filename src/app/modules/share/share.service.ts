// services/share.service.ts
import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
import { IPost } from '../post/post.interface'
import ApiError from '../../../errors/ApiError'
import { Post } from '../post/post.model'

const sharePost = async (
  userId: Types.ObjectId,
  postId: string,
  caption?: string,
): Promise<IPost> => {
  if (!Types.ObjectId.isValid(postId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  // Find original post
  const originalPost = await Post.findById(postId)
  if (!originalPost) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found')
  }

  // Check if post is private
  if (originalPost.privacy === 'private') {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Cannot share private post')
  }

  // Create shared post
  const sharedPost = await Post.create({
    userId,
    content: caption || '', // Share caption
    sharedPostId: originalPost._id,
    isShared: true,
    shareCaption: caption,
    privacy: 'public', // Shared posts are always public
    // You can copy other fields if needed
    tags: originalPost.tags,
    media_source: originalPost.media_source,
  })

  // Update share count on original post
  await Post.findByIdAndUpdate(postId, {
    $inc: { 'metadata.shareCount': 1 },
  })

  // Populate and return
  const populatedPost = await Post.findById(sharedPost._id)
    .populate('userId', 'firstName lastName avatar')
    .populate('sharedPostId')
    .lean()

  return populatedPost as IPost
}

const getSharedPosts = async (
  postId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{ shares: IPost[]; total: number }> => {
  if (!Types.ObjectId.isValid(postId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  const skip = (page - 1) * limit

  const shares = await Post.find({
    sharedPostId: new Types.ObjectId(postId),
    isShared: true,
  })
    .populate('userId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()

  const total = await Post.countDocuments({
    sharedPostId: new Types.ObjectId(postId),
    isShared: true,
  })

  return {
    shares: shares as IPost[],
    total,
  }
}

export const ShareServices = {
  sharePost,
  getSharedPosts,
}
