"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsereventValidations = void 0;
const zod_1 = require("zod");
exports.UsereventValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string(),
            description: zod_1.z.string().optional(),
            // venueId: z.string(),
            startDate: zod_1.z.string().datetime(),
            startTime: zod_1.z.string().datetime(),
            vibeTags: zod_1.z.array(zod_1.z.string()),
            visibility: zod_1.z.boolean(),
            location: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
            address: zod_1.z.string(),
            images: zod_1.z.array(zod_1.z.string()).optional(),
        })
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            title: zod_1.z.string().optional(),
            description: zod_1.z.string().optional(),
            venueId: zod_1.z.string().optional(),
            createdBy: zod_1.z.string().optional(),
            startDate: zod_1.z.string().datetime().optional(),
            startTime: zod_1.z.string().datetime().optional(),
            vibeTags: zod_1.z.array(zod_1.z.string()).optional(),
            visibility: zod_1.z.boolean().optional(),
            goingCount: zod_1.z.number().optional(),
            location: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
            address: zod_1.z.string().optional(),
            images: zod_1.z.array(zod_1.z.string()).optional(),
        })
    }),
};
