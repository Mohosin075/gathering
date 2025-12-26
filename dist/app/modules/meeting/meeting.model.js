"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meeting = void 0;
const mongoose_1 = require("mongoose");
const meetingSchema = new mongoose_1.Schema({
    title: { type: String },
    creator: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    meetingType: {
        type: String,
        enum: ['scheduled', 'instant'],
        required: true,
        default: 'instant',
    },
    startTime: { type: Date },
    endTime: { type: Date },
    roomId: { type: String, required: true },
    joinLink: { type: String, required: true },
    isClosed: { type: Boolean, default: false },
    closedAt: { type: Date },
}, { timestamps: true });
meetingSchema.statics.isAuthorized = async function (meetingId, userId) {
    const meeting = await exports.Meeting.findById(meetingId).select('creator participant');
    if (!meeting)
        return false;
    return (String(meeting.creator) === String(userId) ||
        String(meeting.participant) === String(userId));
};
exports.Meeting = (0, mongoose_1.model)('Meeting', meetingSchema);
