"use client"

import { useEffect } from "react"

/**
 * Persists the currently displayed period (month/year) into cookies so that
 * navigating between dashboard pages keeps the same "anchored" month instead of
 * resetting to the current month. The server reads these cookies via
 * resolvePeriod() when no explicit ?mes/?año query params are present.
 */
export function PeriodAnchor({ month, year }: { month: number; year: number }) {
  useEffect(() => {
    // Session cookies (no max-age): the anchored month resets when the browser closes.
    document.cookie = `periodo_mes=${month}; path=/; SameSite=Lax`
    document.cookie = `periodo_anio=${year}; path=/; SameSite=Lax`
  }, [month, year])

  return null
}
