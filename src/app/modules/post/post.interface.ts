import { Model, Types } from 'mongoose'

export interface MediaItem {
  url: string
  type: 'image' | 'video'
  thumbnail?: string
  duration?: number
  size?: number
  altText?: string
}

export interface IPostFilterables {
  searchTerm?: string
  content?: string
}

export interface IPost {
  _id: Types.ObjectId
  userId: Types.ObjectId
  content: string
  media_source: MediaItem[]
  privacy: 'public' | 'private'
  tags: string[]
  isEdited: boolean
  editedAt?: Date

  // Share specific fields
  sharedPostId?: Types.ObjectId // Reference to original post
  isShared: boolean
  shareCaption?: string

  metadata: {
    likeCount: number
    commentCount: number
    viewCount: number
    shareCount: number
  }
  createdAt?: Date
  updatedAt?: Date
}
export interface IPostPopulated extends Omit<IPost, 'userId' | 'sharedPostId'> {
  userId: {
    _id: Types.ObjectId
    firstName: string
    lastName: string
    avatar?: string
  }
  sharedPost?: IPostPopulated // Populated shared post
  hasLiked?: boolean
}

export type PostModel = Model<IPost, {}, {}>
