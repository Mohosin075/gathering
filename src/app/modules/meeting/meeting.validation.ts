import { z } from 'zod';

const createMeetingZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    participantId: z.string().min(1, { message: 'Participant is required' }),
    meetingType: z.enum(['scheduled', 'instant']),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  }).refine(
    data =>
      data.meetingType === 'instant' ||
      (!!data.startTime && !!data.endTime),
    {
      message: 'startTime and endTime are required for scheduled meetings',
      path: ['startTime'],
    }
  ),
});

export const MeetingValidation = { createMeetingZodSchema };