"use server"

import { createClient } from "@/lib/supabase/server"

// Calculate saldo_anterior for a given month
// This sums all ingresos and gastos from the beginning until the END of the previous month
// This approach handles payments of previous months made later (e.g., paying March expenses in June)
export async function calculateSaldoAnterior(
  condoId: string,
  year: number,
  month: number,
  initialBalance: number,
  initialDate: Date
) {
  const supabase = await createClient()

  // Get the last day of the previous month
  const lastDayOfPreviousMonth = new Date(year, month - 1, 0)
  const endDate = lastDayOfPreviousMonth.toISOString().split('T')[0]

  // Check if we're at the initial month
  if (year === initialDate.getFullYear() && month === initialDate.getMonth() + 1) {
    return initialBalance
  }

  // Get ALL approved ingresos up to end of previous month
  const { data: allIncome, error: incomeError } = await supabase
    .from("condo_income")
    .select("amount")
    .eq("condo_id", condoId)
    .eq("status", "approved")
    .lte("income_date", endDate)

  // Get ALL gastos up to end of previous month
  const { data: allExpenses, error: expensesError } = await supabase
    .from("expenses")
    .select("amount")
    .eq("condo_id", condoId)
    .lte("expense_date", endDate)

  if (incomeError) {
    console.error("[v0] Error fetching income for saldo anterior:", incomeError)
    throw new Error(incomeError.message)
  }

  if (expensesError) {
    console.error("[v0] Error fetching expenses for saldo anterior:", expensesError)
    throw new Error(expensesError.message)
  }

  const totalIncome = (allIncome || []).reduce((sum, inc) => sum + (inc.amount || 0), 0)
  const totalExpenses = (allExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0)

  return initialBalance + totalIncome - totalExpenses
}

// Get all ingresos for a specific month (only those within that month's dates)
export async function getMonthIncome(
  condoId: string,
  year: number,
  month: number
) {
  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("status", "approved")
    .gte("income_date", startDate)
    .lte("income_date", endDate)
    .order("income_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching month income:", error)
    throw new Error(error.message)
  }

  return data || []
}

// Get all gastos for a specific month (only those within that month's dates)
export async function getMonthExpenses(
  condoId: string,
  year: number,
  month: number
) {
  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_type:expense_types(id, name)")
    .eq("condo_id", condoId)
    .gte("expense_date", startDate)
    .lte("expense_date", endDate)
    .order("expense_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching month expenses:", error)
    throw new Error(error.message)
  }

  return data || []
}
