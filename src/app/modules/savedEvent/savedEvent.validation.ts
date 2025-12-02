import { z } from 'zod'

export const SavedEventValidations = {
  create: z.object({
    body: z.object({
      user: z.string().optional(),
      event: z.string(),
      savedAt: z.string().datetime().optional(),
      notifyBefore: z.boolean().optional(),
      notifyReminder: z.boolean().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      user: z.string().optional(),
      event: z.string().optional(),
      savedAt: z.string().datetime().optional(),
      notifyBefore: z.boolean().optional(),
      notifyReminder: z.boolean().optional(),
    }),
  }),
}
