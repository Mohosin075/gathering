"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Activity = void 0;
const mongoose_1 = require("mongoose");
const activitySchema = new mongoose_1.Schema({
    action: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        refPath: 'resourceType', // Dynamic reference based on resourceType
    },
    resourceType: {
        type: String,
        required: true,
        enum: ['Event', 'User', 'Review'],
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Index for efficient fetching of recent activities
activitySchema.index({ timestamp: -1 });
activitySchema.index({ userId: 1 });
activitySchema.index({ resourceId: 1 });
exports.Activity = (0, mongoose_1.model)('Activity', activitySchema);
