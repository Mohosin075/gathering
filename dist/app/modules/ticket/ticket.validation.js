"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketValidations = void 0;
const zod_1 = require("zod");
exports.TicketValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            eventId: zod_1.z.string(),
            attendeeId: zod_1.z.string().optional(),
            ticketType: zod_1.z.enum(['regular', 'vip', 'early_bird']).optional(),
            price: zod_1.z.number().min(0),
            quantity: zod_1.z.number().min(1).max(10),
            promotionCode: zod_1.z.string().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z
            .object({
            status: zod_1.z.enum(['confirmed', 'cancelled', 'refunded']).optional(),
            paymentStatus: zod_1.z.enum(['paid', 'failed', 'refunded']).optional(),
            checkedIn: zod_1.z.boolean().optional(),
        })
            .strict(),
    }),
    checkIn: zod_1.z.object({
        body: zod_1.z.object({
            ticketId: zod_1.z.string(),
        }),
    }),
};
