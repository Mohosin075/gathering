"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStreamValidations = void 0;
// livestream.validation.ts - FIXED VERSION
const zod_1 = require("zod");
// Create Live Stream Validation
const createLiveStreamZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        eventId: zod_1.z.string({ required_error: 'Event ID is required' }),
        title: zod_1.z.string({ required_error: 'Title is required' }),
        description: zod_1.z.string().optional(),
        streamType: zod_1.z.enum(['public', 'private', 'ticketed'], {
            required_error: 'Stream type is required',
        }),
        scheduledStartTime: zod_1.z.string().optional(),
        scheduledEndTime: zod_1.z.string().optional(),
        maxViewers: zod_1.z.number().min(1).max(100000).optional(),
        chatEnabled: zod_1.z.boolean().optional(),
        isRecorded: zod_1.z.boolean().optional(),
        requiresApproval: zod_1.z.boolean().optional(),
        streamPassword: zod_1.z.string().optional(),
        allowedEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        channelName: zod_1.z.string().optional(), // Add this if needed
    }),
});
// Update Live Stream Validation
const updateLiveStreamZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        streamType: zod_1.z.enum(['public', 'private', 'ticketed']).optional(),
        scheduledStartTime: zod_1.z.string().optional(),
        scheduledEndTime: zod_1.z.string().optional(),
        maxViewers: zod_1.z.number().min(1).max(100000).optional(),
        chatEnabled: zod_1.z.boolean().optional(),
        isRecorded: zod_1.z.boolean().optional(),
        requiresApproval: zod_1.z.boolean().optional(),
        streamPassword: zod_1.z.string().optional(),
        allowedEmails: zod_1.z.array(zod_1.z.string().email()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
        thumbnail: zod_1.z.string().optional(),
    }),
});
// Get Agora Token Validation
const getAgoraTokenZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        streamId: zod_1.z.string({ required_error: 'Stream ID is required' }),
    }),
    query: zod_1.z.object({
        role: zod_1.z.enum(['broadcaster', 'viewer']),
    }),
});
exports.LiveStreamValidations = {
    createLiveStream: createLiveStreamZodSchema,
    updateLiveStream: updateLiveStreamZodSchema,
    getAgoraToken: getAgoraTokenZodSchema,
};
