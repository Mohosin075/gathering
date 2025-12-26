"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedEvent = void 0;
const mongoose_1 = require("mongoose");
const savedEventSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    event: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Event' },
    savedAt: { type: Date, default: Date.now },
    notifyBefore: { type: Boolean, default: false },
    notifyReminder: { type: Boolean, default: false },
}, {
    timestamps: true,
});
exports.SavedEvent = (0, mongoose_1.model)('SavedEvent', savedEventSchema);
