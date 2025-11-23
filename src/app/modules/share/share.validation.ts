import z from 'zod'

export const ShareValidations = {
  create: z.object({
    body: z.object({
      postId: z.string(),
      caption: z.string().max(500).optional(),
    }),
  }),
}
