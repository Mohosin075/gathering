"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveStream = void 0;
const mongoose_1 = require("mongoose");
const liveStreamSchema = new mongoose_1.Schema({
    // Core References
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true,
    },
    streamer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // Basic Info
    title: { type: String, required: true },
    description: { type: String },
    // Technical Stream Details
    channelName: { type: String, required: true, unique: true },
    streamKey: { type: String },
    streamId: { type: String, unique: true },
    // Streaming URLs
    rtmpPushUrl: { type: String },
    rtmpPullUrl: { type: String },
    hlsUrl: { type: String },
    playbackUrl: { type: String },
    // Stream Configuration
    streamType: {
        type: String,
        enum: ['public', 'private', 'ticketed'],
        default: 'public',
        required: true,
    },
    streamingMode: {
        type: String,
        enum: ['communication', 'live'],
        default: 'live',
        required: true,
    },
    maxViewers: { type: Number, default: 10000 },
    // Stream Status & Timing
    streamStatus: {
        type: String,
        enum: ['scheduled', 'starting', 'live', 'ended', 'cancelled'],
        default: 'scheduled',
        required: true,
    },
    isLive: { type: Boolean, default: false },
    liveStartedAt: { type: Date },
    liveEndedAt: { type: Date },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    // Viewers & Analytics
    currentViewers: { type: Number, default: 0 },
    totalViewers: { type: Number, default: 0 },
    peakViewers: { type: Number, default: 0 },
    totalViewTime: { type: Number, default: 0 },
    // Features
    chatEnabled: { type: Boolean, default: true },
    chatId: { type: String },
    isRecorded: { type: Boolean, default: false },
    recordingUrl: { type: String },
    thumbnail: { type: String },
    // Monetization & Access Control
    isPaid: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    streamPassword: { type: String },
    allowedEmails: [{ type: String }],
    // REMOVE THESE TWO FIELDS - they should be virtuals
    // isActive: { type: Boolean, default: false },
    // isUpcoming: { type: Boolean, default: false },
    // Metadata
    tags: [{ type: String }],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.streamKey;
            delete ret.__v;
            // Ensure virtuals are included
            ret.isUpcoming = doc.isUpcoming;
            ret.isActive = doc.isActive;
            return ret;
        },
    },
    toObject: {
        virtuals: true,
    },
});
// Indexes
liveStreamSchema.index({ event: 1, streamStatus: 1 });
liveStreamSchema.index({ streamer: 1, createdAt: -1 });
liveStreamSchema.index({ isLive: 1 });
liveStreamSchema.index({ streamType: 1 });
liveStreamSchema.index({ tags: 1 });
liveStreamSchema.index({ scheduledStartTime: 1, streamStatus: 1 });
// Virtuals
liveStreamSchema.virtual('duration').get(function () {
    if (this.liveStartedAt && this.liveEndedAt) {
        return this.liveEndedAt.getTime() - this.liveStartedAt.getTime();
    }
    return 0;
});
// Virtual: isUpcoming
liveStreamSchema.virtual('isUpcoming').get(function () {
    return this.streamStatus === 'scheduled' || this.streamStatus === 'starting';
});
// Virtual: isActive
liveStreamSchema.virtual('isActive').get(function () {
    return this.streamStatus === 'starting' || this.streamStatus === 'live';
});
// Static Methods
liveStreamSchema.statics.canViewStream = async function (streamId, userId) {
    var _a;
    const stream = await this.findById(streamId).lean();
    if (!stream)
        return false;
    // Public streams - anyone can view
    if (stream.streamType === 'public')
        return true;
    // Need user ID for private/ticketed streams
    if (!userId)
        return false;
    // Check if user is streamer
    if (String(stream.streamer) === userId)
        return true;
    // Private streams - check allowed emails
    if (stream.streamType === 'private') {
        const user = await this.db
            .model('User')
            .findById(userId)
            .select('email');
        if (user && ((_a = stream.allowedEmails) === null || _a === void 0 ? void 0 : _a.includes(user.email))) {
            return true;
        }
        return false;
    }
    // Ticketed streams - check payment
    if (stream.streamType === 'ticketed') {
        // Implementation depends on your ticket/payment system
        return false;
    }
    return false;
};
liveStreamSchema.statics.canBroadcast = async function (streamId, userId) {
    const stream = await this.findById(streamId).lean();
    if (!stream)
        return false;
    return String(stream.streamer) === userId;
};
// Pre-save middleware
liveStreamSchema.pre('save', async function (next) {
    if (this.isNew) {
        // Generate unique channel name
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        this.channelName = `stream_${timestamp}_${randomStr}`;
        // Generate secure stream key
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        this.streamKey = crypto.randomBytes(32).toString('hex').substring(0, 32);
        // Generate stream ID
        this.streamId = `agora_${timestamp}_${Math.random()
            .toString(36)
            .substring(2, 10)}`;
    }
    // Update isLive based on streamStatus
    if (this.streamStatus === 'live') {
        this.isLive = true;
        if (!this.liveStartedAt) {
            this.liveStartedAt = new Date();
        }
    }
    else if (this.streamStatus === 'ended' ||
        this.streamStatus === 'cancelled') {
        this.isLive = false;
        if (!this.liveEndedAt) {
            this.liveEndedAt = new Date();
        }
    }
    next();
});
// Ensure virtuals are included in lean queries
liveStreamSchema.set('toObject', { virtuals: true });
liveStreamSchema.set('toJSON', { virtuals: true });
exports.LiveStream = (0, mongoose_1.model)('LiveStream', liveStreamSchema);
