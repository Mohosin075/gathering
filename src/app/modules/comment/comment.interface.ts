// interfaces/comment.interface.ts
import { Document, Types, Model } from 'mongoose'

export interface ICommentFilterables {
  searchTerm?: string
  postId?: string
  parentCommentId?: string
}

export interface IComment extends Document {
  _id: Types.ObjectId
  userId: Types.ObjectId
  postId: Types.ObjectId
  parentCommentId?: Types.ObjectId // For nested comments/replies
  content: string
  media?: ICommentMedia[]
  isEdited: boolean
  editedAt?: Date
  isActive: boolean
  metadata: {
    likeCount: number
    replyCount: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface ICommentMedia {
  url: string
  type: 'image' | 'video'
  thumbnail?: string
  altText?: string
}

export interface ICommentPopulated
  extends Omit<IComment, 'userId' | 'parentCommentId'> {
  userId: {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    avatar?: string
  }
  parentCommentId?: ICommentPopulated
  replies?: ICommentPopulated[]
  hasLiked?: boolean
}

export interface ICommentResponse {
  _id: Types.ObjectId
  content: string
  media?: ICommentMedia[]
  isEdited: boolean
  editedAt?: Date
  metadata: {
    likeCount: number
    replyCount: number
  }
  user: {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    avatar?: string
  }
  hasLiked: boolean
  replies?: ICommentResponse[]
  createdAt: Date
  updatedAt: Date
}

// Request interfaces
export interface ICreateCommentRequest {
  postId: string
  content: string
  media?: File[]
  parentCommentId?: string
}

export interface IUpdateCommentRequest {
  content: string
}

// Static methods for Comment model
export interface CommentModel extends Model<IComment> {
  getCommentsByPost(
    postId: Types.ObjectId,
    page?: number,
    limit?: number,
  ): Promise<ICommentPopulated[]>
  getReplies(commentId: Types.ObjectId): Promise<ICommentPopulated[]>
  updateCommentCounts(postId: Types.ObjectId): Promise<void>
}
