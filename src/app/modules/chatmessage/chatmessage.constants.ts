// Filterable fields for Chatmessage
export const chatmessageFilterables = ['name', 'avatar', 'message'];

// Searchable fields for Chatmessage
export const chatmessageSearchableFields = ['name', 'avatar', 'message'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};