import { z } from 'zod'

export const ChatmessageValidations = {
  sendMessage: z.object({
    body: z.object({
      message: z
        .string({
          required_error: 'Message is required',
        })
        .min(1)
        .max(500),
      messageType: z.enum(['text', 'emoji']).optional(),
    }),
  }),

  getMessages: z.object({
    query: z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      before: z
        .string()
        .datetime()
        .optional(),
    }),
  }),
}
