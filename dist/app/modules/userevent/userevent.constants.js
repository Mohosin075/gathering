"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSetEqual = exports.usereventSearchableFields = exports.usereventFilterables = void 0;
// Filterable fields for Userevent
exports.usereventFilterables = ['title', 'description'];
// Searchable fields for Userevent
exports.usereventSearchableFields = ['title', 'description'];
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
