"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatmessageValidations = void 0;
const zod_1 = require("zod");
exports.ChatmessageValidations = {
    sendMessage: zod_1.z.object({
        body: zod_1.z.object({
            message: zod_1.z
                .string({
                required_error: 'Message is required',
            })
                .min(1)
                .max(500),
            messageType: zod_1.z.enum(['text', 'emoji']).optional(),
        }),
    }),
    getMessages: zod_1.z.object({
        query: zod_1.z.object({
            page: zod_1.z.coerce.number().int().positive().optional(),
            limit: zod_1.z.coerce.number().int().positive().optional(),
            before: zod_1.z
                .string()
                .datetime()
                .optional(),
        }),
    }),
};
