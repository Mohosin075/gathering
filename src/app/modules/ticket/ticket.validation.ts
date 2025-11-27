import { z } from 'zod'

export const TicketValidations = {
  create: z.object({
    body: z.object({
      eventId: z.string(),
      attendeeId: z.string(),
      ticketType: z.enum(['regular', 'vip', 'early_bird']),
      price: z.number().min(0),
      quantity: z.number().min(1).max(10),
      promotionCode: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z
      .object({
        status: z.enum(['confirmed', 'cancelled', 'refunded']).optional(),
        paymentStatus: z.enum(['paid', 'failed', 'refunded']).optional(),
        checkedIn: z.boolean().optional(),
      })
      .strict(),
  }),

  checkIn: z.object({
    body: z.object({
      qrCode: z.string(),
    }),
  }),
}
