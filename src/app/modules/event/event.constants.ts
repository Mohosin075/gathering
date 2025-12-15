// Filterable fields for Event
export const eventFilterables = [
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
]

export const nearbyEventFilterables = [
  'searchTerm',
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
]


// Searchable fields for Event
export const eventSearchableFields = [
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
]

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false
  for (const item of setA) {
    if (!setB.has(item)) return false
  }
  return true
}
