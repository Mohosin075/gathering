// validations/like.validation.ts
import { z } from 'zod'

export const LikeValidations = {
  toggle: z.object({
    body: z.object({
      targetId: z.string(),
      targetType: z.enum(['post', 'comment']),
    }),
  }),

  getLikes: z.object({
    params: z.object({
      targetId: z.string(),
      targetType: z.enum(['post', 'comment']),
    }),
  }),

  checkStatus: z.object({
    params: z.object({
      targetId: z.string(),
      targetType: z.enum(['post', 'comment']),
    }),
  }),
}
