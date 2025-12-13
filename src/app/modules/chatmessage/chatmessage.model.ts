import { model, Schema, Types } from 'mongoose'
import { IChatMessage } from './chatmessage.interface'

const chatMessageSchema = new Schema<IChatMessage>(
  {
    streamId: {
      type: Schema.Types.ObjectId,
      ref: 'LiveStream',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userProfile: {
      name: { type: String },
      avatar: { type: String },
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    messageType: {
      type: String,
      enum: ['text', 'emoji', 'system'],
      default: 'text',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
)

// Index for faster chat retrieval
chatMessageSchema.index({ streamId: 1, createdAt: -1 })
chatMessageSchema.index({ streamId: 1, createdAt: 1 })

// Add virtual for formatted time
chatMessageSchema.virtual('formattedTime').get(function () {
  return this.createdAt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema)
