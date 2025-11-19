import { z } from 'zod'

export const AgreementValidations = {
  create: z.object({
    body: z.object({
      clientName: z.string(),
      date: z.string().datetime(),
      signatureUrl: z.string(),
      propertyAddress: z.string(),
    }),
  }),
}
