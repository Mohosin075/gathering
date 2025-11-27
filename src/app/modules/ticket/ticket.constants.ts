// Filterable fields for Ticket
export const ticketFilterables = ['promotionCode', 'qrCode', 'ticketNumber'];

// Searchable fields for Ticket
export const ticketSearchableFields = ['promotionCode', 'qrCode', 'ticketNumber'];

// Helper function for set comparison
export const isSetEqual = (setA: Set<string>, setB: Set<string>): boolean => {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
};