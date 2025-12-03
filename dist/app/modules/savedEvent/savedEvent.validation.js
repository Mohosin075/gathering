"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedEventValidations = void 0;
const zod_1 = require("zod");
exports.SavedEventValidations = {
    create: zod_1.z.object({
        body: zod_1.z.object({
            user: zod_1.z.string().optional(),
            event: zod_1.z.string(),
            savedAt: zod_1.z.string().datetime().optional(),
            notifyBefore: zod_1.z.boolean().optional(),
            notifyReminder: zod_1.z.boolean().optional(),
        }),
    }),
    update: zod_1.z.object({
        body: zod_1.z.object({
            user: zod_1.z.string().optional(),
            event: zod_1.z.string().optional(),
            savedAt: zod_1.z.string().datetime().optional(),
            notifyBefore: zod_1.z.boolean().optional(),
            notifyReminder: zod_1.z.boolean().optional(),
        }),
    }),
};
