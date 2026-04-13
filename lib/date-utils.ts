/**
 * Get current date/time in Santiago, Chile timezone (America/Santiago, UTC-4)
 * Returns ISO string in Santiago local time (without Z suffix)
 */
export function getSantiagoDateTime(): string {
  const now = new Date()
  
  // Create offset for Santiago (UTC-4)
  // Get UTC time and subtract 4 hours
  const santiagoTime = new Date(now.getTime() - (4 * 60 * 60 * 1000))
  
  // Format as ISO string without Z
  const isoString = santiagoTime.toISOString().slice(0, 19)
  return isoString
}
