// models/Comment.model.ts
import { Schema, Types, model } from 'mongoose'
import { IComment, ICommentMedia, CommentModel } from './comment.interface'
import { Post } from '../post/post.model'

// CommentMedia Sub Schema
const CommentMediaSchema = new Schema<ICommentMedia>(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String },
    altText: { type: String },
  },
  { _id: false },
)

// Main Comment Schema
const CommentSchema = new Schema<IComment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true,
    },
    parentCommentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    media: {
      type: [CommentMediaSchema],
      default: [],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      likeCount: { type: Number, default: 0 },
      replyCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

// Indexes for efficient queries
CommentSchema.index({ postId: 1, createdAt: -1 })
CommentSchema.index({ parentCommentId: 1, createdAt: -1 })
CommentSchema.index({ userId: 1, createdAt: -1 })
CommentSchema.index({ isActive: 1 })

// Static method to get comments by post with pagination
CommentSchema.statics.getCommentsByPost = async function (
  postId: Types.ObjectId,
  page: number = 1,
  limit: number = 10,
): Promise<IComment[]> {
  const skip = (page - 1) * limit

  return await this.find({
    postId,
    parentCommentId: null, // Only top-level comments
    isActive: true,
  })
    .populate('userId', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
}

// Static method to get replies for a comment
CommentSchema.statics.getReplies = async function (
  commentId: Types.ObjectId,
): Promise<IComment[]> {
  return await this.find({
    parentCommentId: commentId,
    isActive: true,
  })
    .populate('userId', 'firstName lastName avatar')
    .sort({ createdAt: 1 })
    .lean()
}

// Static method to update comment counts on post
CommentSchema.statics.updateCommentCounts = async function (
  postId: Types.ObjectId,
): Promise<void> {
  const commentCount = await this.countDocuments({
    postId,
    isActive: true,
    parentCommentId: null, // Only count top-level comments
  })

  // Update post's commentCount
  await Post.findByIdAndUpdate(postId, {
    'metadata.commentCount': commentCount,
  })
}

// Update reply count when a reply is added/deleted
CommentSchema.post('save', async function () {
  if (this.parentCommentId) {
    const replyCount = await this.model('Comment').countDocuments({
      parentCommentId: this.parentCommentId,
      isActive: true,
    })

    await this.model('Comment').findByIdAndUpdate(this.parentCommentId, {
      'metadata.replyCount': replyCount,
    })
  }
})

export const Comment = model<IComment, CommentModel>('Comment', CommentSchema)
