import { z } from 'zod';

export const ChatmessageValidations = {
  create: z.object({
    streamId: z.string(),
    userId: z.string(),
    userProfile: z.record(z.string(), z.any()),
    name: z.string(),
    avatar: z.string().optional(),
    message: z.string(),
    messageType: z.string(),
    isDeleted: z.boolean(),
    deletedAt: z.string().datetime().optional(),
    likes: z.number(),
    likedBy: z.string(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),

  update: z.object({
    streamId: z.string().optional(),
    userId: z.string().optional(),
    userProfile: z.record(z.string(), z.any()).optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    message: z.string().optional(),
    messageType: z.string().optional(),
    isDeleted: z.boolean().optional(),
    deletedAt: z.string().datetime().optional(),
    likes: z.number().optional(),
    likedBy: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }),
};
