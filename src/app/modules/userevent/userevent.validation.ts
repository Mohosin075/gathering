import { z } from 'zod';

export const UsereventValidations = {
  create: z.object({
    body: z.object({
      title: z.string(),
      description: z.string().optional(),
      // venueId: z.string(),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      vibeTags: z.array(z.string()),
      visibility: z.boolean(),
      location: z.record(z.string(), z.any()),
      images: z.array(z.string()).optional(),
    })
  }),

  update: z.object({
    body: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      venueId: z.string().optional(),
      createdBy: z.string().optional(),
      startTime: z.string().datetime().optional(),
      endTime: z.string().datetime().optional(),
      vibeTags: z.array(z.string()).optional(),
      visibility: z.boolean().optional(),
      goingCount: z.number().optional(),
      location: z.record(z.string(), z.any()).optional(),
      images: z.array(z.string()).optional(),
    })
  }),
};
