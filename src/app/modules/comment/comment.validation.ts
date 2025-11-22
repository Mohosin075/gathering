// validations/comment.validation.ts
import { z } from 'zod'

// Comment Media Schema
const commentMediaSchema = z.object({
  url: z.string(),
  type: z.enum(['image', 'video']),
  thumbnail: z.string().optional(),
  altText: z.string().optional(),
})

// Comment Metadata Schema
const commentMetadataSchema = z.object({
  likeCount: z.number().default(0),
  replyCount: z.number().default(0),
})

export const CommentValidations = {
  create: z.object({
    body: z.object({
      postId: z.string(),
      content: z.string(),
      parentCommentId: z.string().optional(),
      media: z.array(commentMediaSchema).default([]),
      isEdited: z.boolean().default(false),
      editedAt: z.string().datetime().optional(),
      metadata: commentMetadataSchema.optional(),
      isActive: z.boolean().default(true),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      content: z.string(),
    }),
  }),

  getComments: z.object({
    params: z.object({
      postId: z.string(),
    }),
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
    }),
  }),

  getReplies: z.object({
    params: z.object({
      commentId: z.string(),
    }),
  }),

  delete: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
}
