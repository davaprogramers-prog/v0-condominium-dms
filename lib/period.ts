import { cookies } from "next/headers"

export const PERIOD_MONTH_COOKIE = "periodo_mes"
export const PERIOD_YEAR_COOKIE = "periodo_anio"

/**
 * Resolves the working period (month/year) for dashboard pages.
 *
 * Priority:
 * 1. Explicit query params (?mes=X&año=Y) — set by the month navigation buttons.
 * 2. The "anchored" period stored in a cookie — persists the month the user is
 *    working on while they navigate between dashboard pages.
 * 3. The current month/year as a fallback.
 *
 * This lets the user pick a month once and keep working on it across pages
 * (reportes, balance, gastos, ingresos, etc.) without resetting to the current month.
 */
export async function resolvePeriod(params: { mes?: string; "año"?: string }) {
  const now = new Date()
  const cookieStore = await cookies()

  const cookieMonth = Number.parseInt(cookieStore.get(PERIOD_MONTH_COOKIE)?.value || "")
  const cookieYear = Number.parseInt(cookieStore.get(PERIOD_YEAR_COOKIE)?.value || "")

  const paramYear = Number.parseInt((params?.["año"] as string) || "")
  const paramMonth = Number.parseInt((params?.mes as string) || "")

  const year = paramYear || (cookieYear || now.getFullYear())
  const month = paramMonth || (cookieMonth || now.getMonth() + 1)

  return { year, month }
}
