"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const mongoose_1 = require("mongoose");
const attendanceSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['going', 'interested', 'checked-in'],
        required: true,
    },
    checkedInAt: {
        type: Date,
    },
    rsvpAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Ensure unique attendance per user-event combination
attendanceSchema.index({ user: 1, event: 1 }, { unique: true });
exports.Attendance = (0, mongoose_1.model)('Attendance', attendanceSchema);
