/**
 * Get current date/time in Santiago, Chile timezone (America/Santiago, UTC-4)
 * Returns ISO string in Santiago local time (without Z suffix)
 */
export function getSantiagoDateTime(): string {
  const now = new Date()
  
  // UTC offset for Santiago, Chile (UTC-4)
  const utcOffset = -4 * 60 * 60 * 1000
  const santiagoTime = new Date(now.getTime() + utcOffset)
  
  // Get UTC components and format manually for correct date-time representation
  const year = santiagoTime.getUTCFullYear()
  const month = String(santiagoTime.getUTCMonth() + 1).padStart(2, '0')
  const day = String(santiagoTime.getUTCDate()).padStart(2, '0')
  const hours = String(santiagoTime.getUTCHours()).padStart(2, '0')
  const minutes = String(santiagoTime.getUTCMinutes()).padStart(2, '0')
  const seconds = String(santiagoTime.getUTCSeconds()).padStart(2, '0')
  
  // Return ISO-like format without Z suffix
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
}
