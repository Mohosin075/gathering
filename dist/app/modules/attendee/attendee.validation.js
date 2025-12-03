"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendeeValidations = void 0;
const zod_1 = require("zod");
exports.AttendeeValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            eventId: zod_1.z.string(),
            ticketId: zod_1.z.string(),
            specialRequirements: zod_1.z.string().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z
            .object({
            checkInStatus: zod_1.z.boolean().optional(),
            specialRequirements: zod_1.z.string().optional(),
            isVerified: zod_1.z.boolean().optional(),
        })
            .strict(),
    }),
    checkIn: zod_1.z.object({
        body: zod_1.z.object({
            ticketId: zod_1.z.string().optional(),
            attendeeId: zod_1.z.string().optional(),
            qrCode: zod_1.z.string().optional(),
        }),
    }),
    filter: zod_1.z.object({
        query: zod_1.z.object({
            searchTerm: zod_1.z.string().optional(),
            eventId: zod_1.z.string().optional(),
            userId: zod_1.z.string().optional(),
            checkInStatus: zod_1.z.string().optional(),
            isVerified: zod_1.z.string().optional(),
            page: zod_1.z.string().optional(),
            limit: zod_1.z.string().optional(),
            sortBy: zod_1.z.string().optional(),
            sortOrder: zod_1.z.string().optional(),
        }),
    }),
};
