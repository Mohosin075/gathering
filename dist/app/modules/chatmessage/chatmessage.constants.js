"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.chatmessageSearchableFields = exports.chatmessageFilterables = void 0;
// Filterable fields for Chatmessage
exports.chatmessageFilterables = ['name', 'avatar', 'message'];
// Searchable fields for Chatmessage
exports.chatmessageSearchableFields = ['name', 'avatar', 'message'];
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
