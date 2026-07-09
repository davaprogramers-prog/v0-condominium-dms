"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"



export async function getCondoExpenses(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  if (year && month) {
    // Try to get by period_month/period_year first (new way)
    const { data: periodData, error: periodError } = await supabase
      .from("expenses")
      .select("*, expense_type:expense_types(id, name)")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
      .order("expense_date", { ascending: false })

    // If period fields don't exist or are null, fallback to expense_date
    const { data: dateData, error: dateError } = await supabase
      .from("expenses")
      .select("*, expense_type:expense_types(id, name)")
      .eq("condo_id", condoId)
      .is("period_month", null)
      .gte("expense_date", `${year}-${String(month).padStart(2, '0')}-01`)
      .lte("expense_date", new Date(year, month, 0).toISOString().split('T')[0])
      .order("expense_date", { ascending: false })

    if (periodError && dateError) {
      console.error("Error fetching expenses:", periodError || dateError)
      return []
    }

    // Combine and deduplicate
    const allData = [...(periodData || []), ...(dateData || [])]
    const seen = new Set()
    return allData.filter((exp: any) => {
      if (seen.has(exp.id)) return false
      seen.add(exp.id)
      return true
    })
  }

  // If no year/month specified, get all expenses
  const { data, error } = await supabase
    .from("expenses")
    .select("*, expense_type:expense_types(id, name)")
    .eq("condo_id", condoId)
    .order("expense_date", { ascending: false })

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }

  return data || []
}

export async function getCondoIncome(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  if (year && month) {
    // Try to get by period_month/period_year first (new way)
    const { data: periodData, error: periodError } = await supabase
      .from("condo_income")
      .select("*")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
      .order("income_date", { ascending: false })

    // If period fields don't exist or are null, fallback to income_date
    const { data: dateData, error: dateError } = await supabase
      .from("condo_income")
      .select("*")
      .eq("condo_id", condoId)
      .is("period_month", null)
      .gte("income_date", `${year}-${String(month).padStart(2, '0')}-01`)
      .lte("income_date", new Date(year, month, 0).toISOString().split('T')[0])
      .order("income_date", { ascending: false })

    if (periodError && dateError) {
      console.error("Error fetching income:", periodError || dateError)
      return []
    }

    // Combine and deduplicate
    const allData = [...(periodData || []), ...(dateData || [])]
    const seen = new Set()
    return allData.filter((inc: any) => {
      if (seen.has(inc.id)) return false
      seen.add(inc.id)
      return true
    })
  }

  // If no year/month specified, get all income
  const { data, error } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .order("income_date", { ascending: false })

  if (error) {
    console.error("Error fetching income:", error)
    return []
  }

  return data || []
}

// Get only income that has been paid (status = verificado) for a specific month
export async function getPaidCondoIncome(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  if (year && month) {
    // Try to get by period_month/period_year first (new way)
    const { data: periodData, error: periodError } = await supabase
      .from("condo_income")
      .select("*")
      .eq("condo_id", condoId)
      .eq("status", "verificado")
      .eq("period_year", year)
      .eq("period_month", month)
      .order("income_date", { ascending: false })

    // If period fields don't exist or are null, fallback to income_date
    const { data: dateData, error: dateError } = await supabase
      .from("condo_income")
      .select("*")
      .eq("condo_id", condoId)
      .eq("status", "verificado")
      .is("period_month", null)
      .gte("income_date", `${year}-${String(month).padStart(2, '0')}-01`)
      .lte("income_date", new Date(year, month, 0).toISOString().split('T')[0])
      .order("income_date", { ascending: false })

    if (periodError && dateError) {
      console.error("Error fetching paid income:", periodError || dateError)
      return []
    }

    // Combine and deduplicate
    const allData = [...(periodData || []), ...(dateData || [])]
    const seen = new Set()
    return allData.filter((inc: any) => {
      if (seen.has(inc.id)) return false
      seen.add(inc.id)
      return true
    })
  }

  // If no year/month specified, get all verified income
  const { data, error } = await supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("status", "verificado")
    .order("income_date", { ascending: false })

  if (error) {
    console.error("Error fetching paid income:", error)
    return []
  }

  return data || []
}

export async function getLast12MonthsData(condoId: string) {
  const supabase = await createClient()
  
  const months: { year: number; month: number; expenses: number; income: number; monthName: string }[] = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const monthName = date.toLocaleDateString("es-CL", { month: "short" }).replace(".", "")
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    // Get expenses by period_month/period_year (new way)
    const { data: expensesPeriod } = await supabase
      .from("expenses")
      .select("amount")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
    
    // Fallback to expense_date for old entries
    const { data: expensesDate } = await supabase
      .from("expenses")
      .select("amount")
      .eq("condo_id", condoId)
      .is("period_month", null)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
    
    // Get income by period_month/period_year (new way)
    const { data: incomePeriod } = await supabase
      .from("condo_income")
      .select("amount")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
    
    // Fallback to income_date for old entries
    const { data: incomeDate } = await supabase
      .from("condo_income")
      .select("amount")
      .eq("condo_id", condoId)
      .is("period_month", null)
      .gte("income_date", startDate)
      .lte("income_date", endDate)
    
    // Combine both sources (avoiding duplicates)
    const allExpenses = [...(expensesPeriod || []), ...(expensesDate || [])]
    const allIncome = [...(incomePeriod || []), ...(incomeDate || [])]
    
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const totalIncome = allIncome.reduce((sum, e) => sum + (e.amount || 0), 0)
    
    months.push({
      year,
      month,
      expenses: totalExpenses,
      income: totalIncome,
      monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    })
  }
  
  return months
}


