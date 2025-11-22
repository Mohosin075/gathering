import { z } from 'zod'

// Media Item Schema
const mediaItemSchema = z.object({
  url: z.string(),
  type: z.enum(['image', 'video']),
  thumbnail: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  altText: z.string().optional(),
})

// Metadata Schema
const metadataSchema = z.object({
  likeCount: z.number().default(0),
  commentCount: z.number().default(0),
  viewCount: z.number().default(0),
})

// MAIN — Post Validations
export const PostValidations = {
  create: z.object({
    body: z.object({
      userId: z.string().optional(),
      content: z.string(),
      media: z.array(mediaItemSchema).default([]),
      privacy: z.enum(['public', 'private']).default('public'),
      tags: z.array(z.string()).default([]),
      isEdited: z.boolean().default(false),
      editedAt: z.string().datetime().optional(),
      metadata: metadataSchema.optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      userId: z.string().optional(),
      content: z.string().optional(),
      media: z.array(mediaItemSchema).optional(),
      privacy: z.enum(['public', 'private']).optional(),
      tags: z.array(z.string()).optional(),
      isEdited: z.boolean().optional(),
      editedAt: z.string().datetime().optional(),
      metadata: metadataSchema.optional(),
      createdAt: z.string().datetime().optional(),
      updatedAt: z.string().datetime().optional(),
    }),
  }),
}
