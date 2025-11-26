// Filterable fields for Event
export const eventFilterables = ['title', 'description', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'timezone', 'meetingLink', 'currency', 'bannerImage'];

// Searchable fields for Event
export const eventSearchableFields = ['title', 'description', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'timezone', 'meetingLink', 'currency', 'bannerImage'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};