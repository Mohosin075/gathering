import { z } from 'zod';

export const UsereventValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string().optional(),
      // venueId: z.string(),
      startDate: z.string().datetime(),
      startTime: z.string().datetime(),
      vibeTags: z.array(z.string()),
      visibility: z.boolean(),
      rsvp: z.enum(['18+', '21+']),
      location: z.record(z.string(), z.any()),
      address: z.string(),
      images: z.array(z.string()).optional(),
    })
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      venueId: z.string().optional(),
      createdBy: z.string().optional(),
      startDate: z.string().datetime().optional(),
      startTime: z.string().datetime().optional(),
      vibeTags: z.array(z.string()).optional(),
      visibility: z.boolean().optional(),
      rsvp: z.enum(['18+', '21+']).optional(),
      goingCount: z.number().optional(),
      location: z.record(z.string(), z.any()).optional(),
      address: z.string().optional(),
      images: z.array(z.string()).optional(),
    })
  }),
};
