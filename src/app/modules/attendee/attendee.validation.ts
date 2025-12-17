import { z } from 'zod'

export const AttendeeValidations = {
  create: z.object({
    body: z.object({
      // eventId: z.string(),
      ticketId: z.string(),
      specialRequirements: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z
      .object({
        checkInStatus: z.boolean().optional(),
        specialRequirements: z.string().optional(),
        isVerified: z.boolean().optional(),
      })
      .strict(),
  }),

  checkIn: z.object({
    body: z.object({
      ticketId: z.string().optional(),
      attendeeId: z.string().optional(),
      qrCode: z.string().optional(),
    }),
  }),

  filter: z.object({
    query: z.object({
      searchTerm: z.string().optional(),
      eventId: z.string().optional(),
      userId: z.string().optional(),
      checkInStatus: z.string().optional(),
      isVerified: z.string().optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
      sortBy: z.string().optional(),
      sortOrder: z.string().optional(),
    }),
  }),
}
