"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const mongoose_1 = require("mongoose");
const event_1 = require("../../../enum/event");
const eventSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: event_1.EVENT_CATEGORIES, required: true },
    tags: { type: [String], default: [] },
    organizerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: event_1.EVENT_STATUS,
        default: event_1.EVENT_STATUS.PENDING,
    },
    features: { type: [String], default: [] },
    visibility: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'public',
    },
    startDate: { type: String, required: true },
    startTime: { type: String, required: true },
    timezone: { type: String },
    locationType: {
        type: String,
        enum: ['physical', 'online'],
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point',
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    address: { type: String, required: true },
    meetingLink: { type: String },
    capacity: { type: Number, required: true },
    ticketsSold: { type: Number, default: 0 },
    ticketPrice: { type: Number, required: true },
    images: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    // Live Stream Reference
    hasLiveStream: {
        type: Boolean,
        default: false,
    },
    liveStreamId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'LiveStream',
        default: null,
    },
    isStreamingActive: {
        type: Boolean,
        default: false,
    },
}, {
    toJSON: { virtuals: true, transform: sanitizeOrganizer },
    toObject: { virtuals: true, transform: sanitizeOrganizer },
    timestamps: true,
});
eventSchema.index({ location: '2dsphere' });
// Transform function to sanitize populated organizer fields
function sanitizeOrganizer(doc, ret) {
    if (ret.organizerId && typeof ret.organizerId === 'object') {
        // Keep only safe fields
        ret.organizerId = {
            _id: ret.organizerId._id,
            name: ret.organizerId.name,
            email: ret.organizerId.email,
            role: ret.organizerId.role,
            timezone: ret.organizerId.timezone,
            profile: ret.organizerId.profile,
        };
    }
    return ret;
}
exports.Event = (0, mongoose_1.model)('Event', eventSchema);
