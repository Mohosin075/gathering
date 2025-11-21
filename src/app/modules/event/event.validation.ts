import { z } from 'zod'

export const EventValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      organizerId: z.string(),
      status: z
        .enum(['draft', 'published', 'cancelled', 'archived'])
        .default('draft'),
      visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
      startDate: z.string(),
      startTime: z.string(),
      timezone: z.string(),
      locationType: z.enum(['physical', 'online']).default('online'),
      location: z.object({
        type: z.literal('Point').default('Point'),
        coordinates: z.array(z.number()).length(2).default([0, 0]), // [longitude, latitude]
      }),
      address: z.string(),
      meetingLink: z.string().optional(),
      capacity: z.number(),
      ticketsSold: z.number().default(0),
      ticketPrice: z.number(),
      bannerImage: z.string().optional(),
      gallery: z.array(z.string()).default([]),
      views: z.number().default(0),
      favorites: z.number().default(0),
    }),
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
      tags: z.array(z.string()).optional(),
      organizerId: z.string().optional(),
      status: z
        .enum(['draft', 'published', 'cancelled', 'archived'])
        .optional(),
      visibility: z.enum(['public', 'private', 'unlisted']).optional(),
      startDate: z.string().optional(),
      startTime: z.string().optional(),
      timezone: z.string().optional(),
      locationType: z.enum(['physical', 'online']).optional(),
      location: z
        .object({
          type: z.literal('Point'),
          coordinates: z.array(z.number()).length(2),
        })
        .optional(),
      address: z.string().optional(),
      meetingLink: z.string().optional(),
      capacity: z.number().optional(),
      ticketsSold: z.number().optional(),
      ticketPrice: z.number().optional(),
      bannerImage: z.string().optional(),
      gallery: z.array(z.string()).optional(),
      views: z.number().optional(),
      favorites: z.number().optional(),
    }),
  }),
}
