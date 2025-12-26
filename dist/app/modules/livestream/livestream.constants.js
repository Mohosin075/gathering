"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.livestreamSearchableFields = exports.livestreamFilterables = void 0;
// Filterable fields for Livestream
exports.livestreamFilterables = ['title', 'description', 'channelName', 'streamKey', 'streamId', 'rtmpPushUrl', 'rtmpPullUrl', 'hlsUrl', 'playbackUrl', 'streamType', 'streamingMode', 'streamStatus', 'chatId', 'recordingUrl', 'thumbnail', 'streamPassword'];
// Searchable fields for Livestream
exports.livestreamSearchableFields = ['title', 'description', 'channelName', 'streamKey', 'streamId', 'rtmpPushUrl', 'rtmpPullUrl', 'hlsUrl', 'playbackUrl', 'chatId', 'recordingUrl', 'thumbnail', 'streamPassword'];
// Helper function for set comparison
const isSetEqual = (setA, setB) => {
    if (setA.size !== setB.size)
        return false;
    for (const item of setA) {
        if (!setB.has(item))
            return false;
    }
    return true;
};
exports.isSetEqual = isSetEqual;
