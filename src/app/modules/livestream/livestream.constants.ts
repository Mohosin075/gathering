// Filterable fields for Livestream
export const livestreamFilterables = ['title', 'description', 'channelName', 'streamKey', 'streamId', 'rtmpPushUrl', 'rtmpPullUrl', 'hlsUrl', 'playbackUrl', 'streamType', 'streamingMode', 'streamStatus', 'chatId', 'recordingUrl', 'thumbnail', 'streamPassword'];

// Searchable fields for Livestream
export const livestreamSearchableFields = ['title', 'description', 'channelName', 'streamKey', 'streamId', 'rtmpPushUrl', 'rtmpPullUrl', 'hlsUrl', 'playbackUrl', 'chatId', 'recordingUrl', 'thumbnail', 'streamPassword'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};