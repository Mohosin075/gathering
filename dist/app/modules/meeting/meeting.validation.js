"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingValidation = void 0;
const zod_1 = require("zod");
const createMeetingZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        participantId: zod_1.z.string().min(1, { message: 'Participant is required' }),
        meetingType: zod_1.z.enum(['scheduled', 'instant']),
        startTime: zod_1.z.string().optional(),
        endTime: zod_1.z.string().optional(),
    }).refine(data => data.meetingType === 'instant' ||
        (!!data.startTime && !!data.endTime), {
        message: 'startTime and endTime are required for scheduled meetings',
        path: ['startTime'],
    }),
});
exports.MeetingValidation = { createMeetingZodSchema };
