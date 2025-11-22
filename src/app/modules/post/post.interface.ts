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
  metadata: {
    likeCount: number
    commentCount: number
    viewCount: number
  }
  createdAt?: Date
  updatedAt?: Date
}

export type PostModel = Model<IPost, {}, {}>
