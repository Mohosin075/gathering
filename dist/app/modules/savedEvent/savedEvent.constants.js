"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.savedEventSearchableFields = exports.savedEventFilterables = void 0;
// Filterable fields for SavedEvent
exports.savedEventFilterables = [
    'searchTerm',
    'filter', // Add this for upcoming/past/today filter
    'user',
    'event',
    'savedAt',
    'notifyBefore',
    'notifyReminder',
];
// Searchable fields for SavedEvent (none are text-based in this model)
exports.savedEventSearchableFields = [];
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
