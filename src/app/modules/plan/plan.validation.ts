import { z } from 'zod'

export const createPlanZodValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }),
    description: z.string({ required_error: 'Description is required' }),
    features: z.array(z.string({ required_error: 'Feature is required' })),
    price: z.number({ required_error: 'Price is required' }),

    duration: z.enum(
      ['1 month', '3 months', '6 months', '1 year', 'One Time'],
      {
        required_error: 'Duration is required',
      },
    ),
    paymentType: z.enum(['Monthly', 'Yearly', 'One Time'], {
      required_error: 'Payment type is required',
    }),

    

    // Plan status
    status: z.enum(['active', 'Delete']).default('active'),
  }),
})
