"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.eventSearchableFields = exports.eventFilterables = void 0;
// Filterable fields for Event
exports.eventFilterables = [
    'searchTerm',
    'title',
    'description',
    'category',
    'startDate',
    'endDate',
    'startTime',
    'endTime',
    'timezone',
    'meetingLink',
    'currency',
    'images',
    'status',
];
// Searchable fields for Event
exports.eventSearchableFields = [
    'searchTerm',
    'title',
    'description',
    'category',
    'startDate',
    'endDate',
    'startTime',
    'endTime',
    'timezone',
    'meetingLink',
    'currency',
    'images',
];
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
