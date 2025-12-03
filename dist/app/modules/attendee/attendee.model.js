"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendee = void 0;
const mongoose_1 = require("mongoose");
const attendeeSchema = new mongoose_1.Schema({
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    ticketId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true,
        index: true,
        unique: true,
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        index: true,
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
    checkInStatus: {
        type: Boolean,
        default: false,
    },
    checkInTime: {
        type: Date,
    },
    checkInBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    specialRequirements: {
        type: String,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
attendeeSchema.index({ eventId: 1, userId: 1 });
attendeeSchema.index({ checkInStatus: 1 });
attendeeSchema.index({ eventId: 1, checkInStatus: 1 });
exports.Attendee = (0, mongoose_1.model)('Attendee', attendeeSchema);
