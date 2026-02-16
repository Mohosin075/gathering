"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Userevent = void 0;
const mongoose_1 = require("mongoose");
const usereventSchema = new mongoose_1.Schema({
    title: { type: String },
    description: { type: String },
    venueId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Venue' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    startDate: { type: Date },
    startTime: { type: Date },
    vibeTags: { type: [String] },
    visibility: { type: Boolean, default: true },
    goingCount: { type: Number, default: 0 },
    location: { type: mongoose_1.Schema.Types.Mixed },
    images: { type: [String], default: [] },
}, {
    timestamps: true
});
exports.Userevent = (0, mongoose_1.model)('Userevent', usereventSchema);
