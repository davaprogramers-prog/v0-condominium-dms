/**
 * Get current date/time in Santiago, Chile timezone (America/Santiago)
 * Returns ISO string in the Santiago timezone
 */
export function getSantiagoDateTime(): string {
  const now = new Date()
  
  // Create a formatter for Santiago timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  })
  
  const parts = formatter.formatToParts(now)
  const dateObj: Record<string, string> = {}
  
  parts.forEach(part => {
    dateObj[part.type] = part.value
  })
  
  // Construct ISO string with Santiago time
  const isoString = `${dateObj.year}-${dateObj.month}-${dateObj.day}T${dateObj.hour}:${dateObj.minute}:${dateObj.second}.000Z`
  return isoString
}
