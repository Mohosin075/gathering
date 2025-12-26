"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const mongoose_1 = require("mongoose");
const chatMessageSchema = new mongoose_1.Schema({
    streamId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LiveStream',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    userProfile: {
        name: { type: String },
        avatar: { type: String },
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    messageType: {
        type: String,
        enum: ['text', 'emoji', 'system'],
        default: 'text',
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
// Index for faster chat retrieval
chatMessageSchema.index({ streamId: 1, createdAt: -1 });
chatMessageSchema.index({ streamId: 1, createdAt: 1 });
// Add virtual for formatted time
chatMessageSchema.virtual('formattedTime').get(function () {
    return this.createdAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
});
exports.ChatMessage = (0, mongoose_1.model)('ChatMessage', chatMessageSchema);
