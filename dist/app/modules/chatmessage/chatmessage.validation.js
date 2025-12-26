"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatmessageValidations = void 0;
const zod_1 = require("zod");
exports.ChatmessageValidations = {
    create: zod_1.z.object({
        streamId: zod_1.z.string(),
        userId: zod_1.z.string(),
        userProfile: zod_1.z.record(zod_1.z.string(), zod_1.z.any()),
        name: zod_1.z.string(),
        avatar: zod_1.z.string().optional(),
        message: zod_1.z.string(),
        messageType: zod_1.z.string(),
        isDeleted: zod_1.z.boolean(),
        deletedAt: zod_1.z.string().datetime().optional(),
        likes: zod_1.z.number(),
        likedBy: zod_1.z.string(),
        createdAt: zod_1.z.string().datetime(),
        updatedAt: zod_1.z.string().datetime(),
    }),
    update: zod_1.z.object({
        streamId: zod_1.z.string().optional(),
        userId: zod_1.z.string().optional(),
        userProfile: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
        name: zod_1.z.string().optional(),
        avatar: zod_1.z.string().optional(),
        message: zod_1.z.string().optional(),
        messageType: zod_1.z.string().optional(),
        isDeleted: zod_1.z.boolean().optional(),
        deletedAt: zod_1.z.string().datetime().optional(),
        likes: zod_1.z.number().optional(),
        likedBy: zod_1.z.string().optional(),
        createdAt: zod_1.z.string().datetime().optional(),
        updatedAt: zod_1.z.string().datetime().optional(),
    }),
};
