import { z } from 'zod'
import { EVENT_STATUS } from '../../../enum/event'

export const EventValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      features: z.array(z.string()).default([]),
      organizerId: z.string().optional(),
      status: z
        .enum([
          EVENT_STATUS.PENDING,
          EVENT_STATUS.PUBLISHED,
          EVENT_STATUS.CANCELLED,
          EVENT_STATUS.ARCHIVED,
          EVENT_STATUS.APPROVED,
          EVENT_STATUS.COMPLETED,
          EVENT_STATUS.REJECTED,
        ])
        .default(EVENT_STATUS.PENDING),
      visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
      startDate: z.string(),
      startTime: z.string(),
      timezone: z.string().optional(),
      locationType: z.enum(['physical', 'online']).default('online'),
      // location: z.object({
      //   type: z.literal('Point').default('Point'),
      //   coordinates: z.array(z.number()).length(2).default([0, 0]), // [longitude, latitude]
      //   address: z.string().optional(),
      // }),
      address: z.string(),
      meetingLink: z.string().optional(),
      capacity: z.number(),
      ticketsSold: z.number().default(0),
      ticketPrice: z.number(),
      images: z.array(z.string()).optional(),
      gallery: z.array(z.string()).default([]),
      views: z.number().default(0),
      favorites: z.number().default(0),
    }),
  }),

  update: z.object({
    body: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
        status: z
          .enum([
            EVENT_STATUS.PENDING,
            EVENT_STATUS.PUBLISHED,
            EVENT_STATUS.CANCELLED,
            EVENT_STATUS.ARCHIVED,
            EVENT_STATUS.APPROVED,
            EVENT_STATUS.COMPLETED,
            EVENT_STATUS.REJECTED,
          ])
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
        images: z.array(z.string()).optional(),
        gallery: z.array(z.string()).optional(),
        views: z.number().optional(),
        favorites: z.number().optional(),
      })
      .strict(),
  }),
}


export const nearbySchema = z.object({
  body: z.object({
    lat: z
      .union([z.string(), z.number()])
      .refine(val => !isNaN(Number(val)), {
        message: 'Latitude must be a valid number',
      })
      .transform(val => Number(val)),
    lng: z
      .union([z.string(), z.number()])
      .refine(val => !isNaN(Number(val)), {
        message: 'Longitude must be a valid number',
      })
      .transform(val => Number(val)),
    distance: z
      .union([z.string(), z.number()])
      .optional()
      .transform(val => (val ? Number(val) : 10)),
    category: z.string().optional(),
    tags: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform(val => {
        if (!val) return []
        if (Array.isArray(val)) return val
        return val.split(',')
      }), // comma-separated strings or array
    searchTerm: z.string().optional(),
  }),
})