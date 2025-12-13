import { Document, Types } from 'mongoose'

export interface IChatMessage extends Document {
  _id: Types.ObjectId
  streamId: Types.ObjectId
  userId: Types.ObjectId
  userProfile: {
    name: string
    avatar?: string
  }
  message: string
  messageType: 'text' | 'emoji' | 'system'
  isDeleted: boolean
  deletedAt?: Date
  likes: number
  likedBy: Types.ObjectId[]
  formattedTime?: string
  createdAt: Date
  updatedAt: Date
}

export interface ISendMessageDTO {
  message: string
  messageType?: 'text' | 'emoji'
}

export interface IChatMessageResponseDTO {
  id: string
  userId: string
  userProfile: {
    name: string
    avatar?: string
  }
  message: string
  messageType: string
  formattedTime: string
  likes: number
  hasLiked: boolean
  createdAt: Date
}

export interface IChatListQueryDTO {
  page?: number
  limit?: number
  before?: Date
}

export interface IPaginatedResponse<T> {
  success: boolean
  statusCode: number
  message: string
  meta: {
    page: number
    limit: number
    total: number
    totalPages?: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  }
  data: T[]
}
