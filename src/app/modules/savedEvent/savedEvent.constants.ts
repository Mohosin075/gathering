// Filterable fields for SavedEvent
export const savedEventFilterables = [
  'searchTerm',
  'filter', // Add this for upcoming/past/today filter
  'user',
  'event',
  'savedAt',
  'notifyBefore',
  'notifyReminder',
]

// Searchable fields for SavedEvent (none are text-based in this model)
export const savedEventSearchableFields: string[] = []

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false
  for (const item of setA) {
    if (!setB.has(item)) return false
  }
  return true
}

// Optional: Add type for filter
export type SavedEventFilterType = 'all' | 'upcoming' | 'past' | 'today'
