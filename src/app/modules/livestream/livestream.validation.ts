// livestream.validation.ts - FIXED VERSION
import { z } from 'zod'

// Create Live Stream Validation
const createLiveStreamZodSchema = z.object({
  body: z.object({
    eventId: z.string({ required_error: 'Event ID is required' }),
    title: z.string({ required_error: 'Title is required' }),
    description: z.string().optional(),
    streamType: z.enum(['public', 'private', 'ticketed'], {
      required_error: 'Stream type is required',
    }),
    scheduledStartTime: z.string().optional(),
    scheduledEndTime: z.string().optional(),
    maxViewers: z.number().min(1).max(100000).optional(),
    chatEnabled: z.boolean().optional(),
    isRecorded: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    streamPassword: z.string().optional(),
    allowedEmails: z.array(z.string().email()).optional(),
    tags: z.array(z.string()).optional(),
    channelName: z.string().optional(), // Add this if needed
  }),
})

// Update Live Stream Validation
const updateLiveStreamZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    streamType: z.enum(['public', 'private', 'ticketed']).optional(),
    scheduledStartTime: z.string().optional(),
    scheduledEndTime: z.string().optional(),
    maxViewers: z.number().min(1).max(100000).optional(),
    chatEnabled: z.boolean().optional(),
    isRecorded: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    streamPassword: z.string().optional(),
    allowedEmails: z.array(z.string().email()).optional(),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().optional(),
  }),
})

// Get Agora Token Validation
const getAgoraTokenZodSchema = z.object({
  params: z.object({
    streamId: z.string({ required_error: 'Stream ID is required' }),
  }),
  query: z.object({
    role: z.enum(['broadcaster', 'viewer']),
  }),
})

export const LiveStreamValidations = {
  createLiveStream: createLiveStreamZodSchema,
  updateLiveStream: updateLiveStreamZodSchema,
  getAgoraToken: getAgoraTokenZodSchema,
}
