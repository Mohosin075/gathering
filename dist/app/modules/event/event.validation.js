"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nearbySchema = exports.EventValidations = void 0;
const zod_1 = require("zod");
const event_1 = require("../../../enum/event");
exports.EventValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string(),
            category: zod_1.z.string(),
            tags: zod_1.z.array(zod_1.z.string()).default([]),
            features: zod_1.z.array(zod_1.z.string()).default([]),
            organizerId: zod_1.z.string().optional(),
            status: zod_1.z
                .enum([
                event_1.EVENT_STATUS.PENDING,
                event_1.EVENT_STATUS.PUBLISHED,
                event_1.EVENT_STATUS.CANCELLED,
                event_1.EVENT_STATUS.ARCHIVED,
                event_1.EVENT_STATUS.APPROVED,
                event_1.EVENT_STATUS.COMPLETED,
                event_1.EVENT_STATUS.REJECTED,
            ])
                .default(event_1.EVENT_STATUS.PENDING),
            visibility: zod_1.z.enum(['public', 'private', 'unlisted']).default('public'),
            startDate: zod_1.z.string(),
            startTime: zod_1.z.string(),
            timezone: zod_1.z.string().optional(),
            locationType: zod_1.z.enum(['physical', 'online']).default('online'),
            // location: z.object({
            //   type: z.literal('Point').default('Point'),
            //   coordinates: z.array(z.number()).length(2).default([0, 0]), // [longitude, latitude]
            //   address: z.string().optional(),
            // }),
            address: zod_1.z.string(),
            meetingLink: zod_1.z.string().optional(),
            capacity: zod_1.z.number(),
            ticketsSold: zod_1.z.number().default(0),
            ticketPrice: zod_1.z.number(),
            images: zod_1.z.array(zod_1.z.string()).optional(),
            gallery: zod_1.z.array(zod_1.z.string()).default([]),
            views: zod_1.z.number().default(0),
            favorites: zod_1.z.number().default(0),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z
            .object({
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            status: zod_1.z
                .enum([
                event_1.EVENT_STATUS.PENDING,
                event_1.EVENT_STATUS.PUBLISHED,
                event_1.EVENT_STATUS.CANCELLED,
                event_1.EVENT_STATUS.ARCHIVED,
                event_1.EVENT_STATUS.APPROVED,
                event_1.EVENT_STATUS.COMPLETED,
                event_1.EVENT_STATUS.REJECTED,
            ])
                .optional(),
            visibility: zod_1.z.enum(['public', 'private', 'unlisted']).optional(),
            startDate: zod_1.z.string().optional(),
            category: zod_1.z.string().optional(),
            startTime: zod_1.z.string().optional(),
            timezone: zod_1.z.string().optional(),
            locationType: zod_1.z.enum(['physical', 'online']).optional(),
            address: zod_1.z.string().optional(),
            meetingLink: zod_1.z.string().optional(),
            capacity: zod_1.z.number().optional(),
            ticketPrice: zod_1.z.number().optional(),
            images: zod_1.z.array(zod_1.z.string()).optional(),
            favorites: zod_1.z.number().optional(),
        })
            .strict(),
    }),
};
exports.nearbySchema = zod_1.z.object({
    body: zod_1.z.object({
        lat: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .refine(val => !isNaN(Number(val)), {
            message: 'Latitude must be a valid number',
        })
            .transform(val => Number(val)),
        lng: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .refine(val => !isNaN(Number(val)), {
            message: 'Longitude must be a valid number',
        })
            .transform(val => Number(val)),
        distance: zod_1.z
            .union([zod_1.z.string(), zod_1.z.number()])
            .optional()
            .transform(val => (val ? Number(val) : 10)),
        category: zod_1.z.string().optional(),
        tags: zod_1.z
            .union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())])
            .optional()
            .transform(val => {
            if (!val)
                return [];
            if (Array.isArray(val))
                return val;
            return val.split(',');
        }), // comma-separated strings or array
        searchTerm: zod_1.z.string().optional(),
    }),
});
