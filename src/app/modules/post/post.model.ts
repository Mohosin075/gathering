import { Schema, model } from 'mongoose'
import { IPost, PostModel } from './post.interface'

// MediaItem Sub Schema
const MediaItemSchema = new Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: { type: String },
    duration: { type: Number },
    size: { type: Number },
    altText: { type: String },
  },
  { _id: false },
)

// Main Post Schema
const PostSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },

    media_source: {
      type: [MediaItemSchema],
      default: [],
    },

    privacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },

    tags: {
      type: [String],
      default: [],
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    editedAt: {
      type: Date,
    },

    metadata: {
      likeCount: { type: Number, default: 0 },
      commentCount: { type: Number, default: 0 },
      viewCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
    versionKey: false,
  },
)

PostSchema.index({ createdAt: -1, userId: 1 })

// Export Model
export const Post = model<IPost, PostModel>('Post', PostSchema)
