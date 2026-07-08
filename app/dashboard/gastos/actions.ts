"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"



export async function getCondoExpenses(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  let query = supabase
    .from("expenses")
    .select("*, expense_type:expense_types(id, name)")
    .eq("condo_id", condoId)

  if (year && month) {
    // Filter by actual expense_date month/year (not using period fields since they don't exist in expenses table)
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    query = query
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
  }

  const { data, error } = await query.order("expense_date", { ascending: false })

  if (error) {
    console.error("Error fetching expenses:", error)
    return []
  }

  return data || []
}

export async function getCondoIncome(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  // Get all income first (without join)
  let query = supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)

  if (year) {
    query = query.eq("period_year", year)
  }
  if (month) {
    query = query.eq("period_month", month)
  }

  const { data, error } = await query.order("income_date", { ascending: false })

  if (error) {
    console.error("Error fetching income:", error)
    return []
  }

  return data || []
}

// Get only income that has been paid (status = approved)
export async function getPaidCondoIncome(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  let query = supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("status", "approved")

  if (year) {
    query = query.eq("period_year", year)
  }
  if (month) {
    query = query.eq("period_month", month)
  }

  const { data, error } = await query.order("income_date", { ascending: false })

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
    
    // Get expenses for this month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    const { data: expensesData } = await supabase
      .from("expenses")
      .select("amount")
      .eq("condo_id", condoId)
      .gte("expense_date", startDate)
      .lte("expense_date", endDate)
    
    // Get income for this month
    const { data: incomeData } = await supabase
      .from("condo_income")
      .select("amount")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
    
    const totalExpenses = expensesData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    const totalIncome = incomeData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0
    
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


