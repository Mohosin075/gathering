// services/comment.service.ts
import { StatusCodes } from 'http-status-codes'
import { Types } from 'mongoose'
import { IComment, ICommentPopulated, ICreateCommentRequest } from './comment.interface'
import ApiError from '../../../errors/ApiError'
import { Post } from '../post/post.model'
import { Comment } from './comment.model'


const createComment = async (
  userId: string | Types.ObjectId,
  commentData: ICreateCommentRequest,
): Promise<IComment> => {
  const { postId, content, parentCommentId } = commentData

  if (!Types.ObjectId.isValid(postId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  // Check if post exists
  const post = await Post.findById(postId)
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found')
  }

  // If it's a reply, check if parent comment exists
  if (parentCommentId) {
    if (!Types.ObjectId.isValid(parentCommentId)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Parent Comment ID')
    }

    const parentComment = await Comment.findById(parentCommentId)
    if (!parentComment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Parent comment not found')
    }
  }

  const comment = await Comment.create({
    userId: new Types.ObjectId(userId),
    postId: new Types.ObjectId(postId),
    content,
    parentCommentId: parentCommentId
      ? new Types.ObjectId(parentCommentId)
      : null,
  })

  // Update comment count in post
  await Comment.updateCommentCounts(new Types.ObjectId(postId))

  const populatedComment = await Comment.findById(comment._id)
    .populate('userId', 'firstName lastName avatar')
    .lean()

  return populatedComment as IComment
}

const getComments = async (
  postId: string,
  page: number = 1,
  limit: number = 10,
): Promise<{
  comments: ICommentPopulated[]
  total: number
  page: number
  totalPages: number
}> => {
  if (!Types.ObjectId.isValid(postId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Post ID')
  }

  const post = await Post.findById(postId)
  if (!post) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Post not found')
  }

  const comments = await Comment.getCommentsByPost(
    new Types.ObjectId(postId),
    page,
    limit,
  )

  // Add like status for each comment if user is authenticated
  const commentsWithLikeStatus = await Promise.all(
    comments.map(async comment => {
      const hasLiked = false // You can add user ID here if needed
      return {
        ...comment,
        hasLiked,
      }
    }),
  )

  const total = post.metadata.commentCount
  const totalPages = Math.ceil(total / limit)

  return {
    comments: commentsWithLikeStatus,
    total,
    page,
    totalPages,
  }
}

const getReplies = async (commentId: string): Promise<ICommentPopulated[]> => {
  if (!Types.ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Comment ID')
  }

  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found')
  }

  const replies = await Comment.getReplies(new Types.ObjectId(commentId))

  // Add like status for each reply
  const repliesWithLikeStatus = await Promise.all(
    replies.map(async reply => {
      const hasLiked = false // You can add user ID here if needed
      return {
        ...reply,
        hasLiked,
      }
    }),
  )

  return repliesWithLikeStatus
}

const updateComment = async (
  commentId: string,
  userId: string | Types.ObjectId,
  updateData: { content: string },
): Promise<IComment> => {
  if (!Types.ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Comment ID')
  }

  const comment = await Comment.findOne({
    _id: commentId,
    userId: new Types.ObjectId(userId),
  })
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or you are not authorized to update it',
    )
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: updateData.content,
      isEdited: true,
      editedAt: new Date(),
    },
    { new: true, runValidators: true },
  ).populate('userId', 'firstName lastName avatar')

  if (!updatedComment) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Comment not found after update')
  }

  return updatedComment as IComment
}

const deleteComment = async (
  commentId: string,
  userId: string | Types.ObjectId,
): Promise<IComment> => {
  if (!Types.ObjectId.isValid(commentId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid Comment ID')
  }

  const comment = await Comment.findOne({
    _id: commentId,
    userId: new Types.ObjectId(userId),
  })
  if (!comment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found or you are not authorized to delete it',
    )
  }

  // Soft delete by setting isActive to false
  const deletedComment = await Comment.findByIdAndUpdate(
    commentId,
    { isActive: false },
    { new: true },
  )

  if (!deletedComment) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Comment not found after deletion',
    )
  }

  // Update comment count in post
  await Comment.updateCommentCounts(comment.postId)

  return deletedComment as IComment
}

export const CommentServices = {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
}
