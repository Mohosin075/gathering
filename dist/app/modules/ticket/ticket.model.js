"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const mongoose_1 = require("mongoose");
const ticketSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    attendeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ticketType: {
        type: String,
        enum: ['regular', 'vip', 'early_bird'],
        required: true,
        default: 'regular',
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    promotionCode: {
        type: String,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    finalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },
    qrCode: {
        type: String,
        required: true,
    },
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
    },
    checkedIn: {
        type: Boolean,
        default: false,
    },
    checkedInAt: {
        type: Date,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
// Indexes
ticketSchema.index({ eventId: 1, attendeeId: 1 });
ticketSchema.index({ status: 1, paymentStatus: 1 });
exports.Ticket = (0, mongoose_1.model)('Ticket', ticketSchema);
