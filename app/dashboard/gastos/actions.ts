"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCondoExpense(
  condoId: string,
  formData: {
    title: string
    description: string
    amount: number
    category: string
    expenseDate: string
    receiptUrl?: string
    expenseLogoId?: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin of this condo
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const canAccessCondo = profile?.condo_id === condoId || profile?.role === "super_admin"
  
  if (!isAdmin || !canAccessCondo) {
    throw new Error("No tienes permisos para crear gastos")
  }

  // Get period from expense date
  const date = new Date(formData.expenseDate)
  const periodYear = date.getFullYear()
  const periodMonth = date.getMonth() + 1

  const { error } = await supabase
    .from("condo_expenses")
    .insert({
      condo_id: condoId,
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      expense_date: formData.expenseDate,
      period_year: periodYear,
      period_month: periodMonth,
      receipt_url: formData.receiptUrl,
      expense_logo_id: formData.expenseLogoId && formData.expenseLogoId !== "none" ? formData.expenseLogoId : null,
      created_by: user.id,
    })

  if (error) {
    console.error("[v0] Error creating expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/gastos")
  return { success: true }
}

export async function getCondoExpenses(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

  // Filter by actual expense_date, not period_year/period_month which represent registration date
  let query = supabase
    .from("condo_expenses")
    .select("*, expense_logo:expense_logos(id, name, logo_url)")
    .eq("condo_id", condoId)

  if (year && month) {
    // Create date range for the month: from the 1st to the last day
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of the month
    
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

  // Get income with approved status - filter by actual income_date, not period_year/period_month
  let query = supabase
    .from("condo_income")
    .select("*")
    .eq("condo_id", condoId)
    .eq("status", "approved")

  if (year && month) {
    // Create date range for the month: from the 1st to the last day
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of the month
    
    query = query
      .gte("income_date", startDate)
      .lte("income_date", endDate)
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
    const { data: expensesData } = await supabase
      .from("condo_expenses")
      .select("amount")
      .eq("condo_id", condoId)
      .eq("period_year", year)
      .eq("period_month", month)
    
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

export async function updateExpense(
  expenseId: string,
  formData: {
    title: string
    description: string
    amount: number
    expenseDate: string
    category: string
    receiptUrl?: string
    expenseLogoId?: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden editar gastos")
  }

  // Get period from expense date
  const date = new Date(formData.expenseDate)
  const periodYear = date.getFullYear()
  const periodMonth = date.getMonth() + 1

  const { error } = await supabase
    .from("condo_expenses")
    .update({
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      expense_date: formData.expenseDate,
      period_year: periodYear,
      period_month: periodMonth,
      receipt_url: formData.receiptUrl,
      expense_logo_id: formData.expenseLogoId || null,
    })
    .eq("id", expenseId)

  if (error) {
    console.error("[v0] Error updating expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/gastos")
  return { success: true }
}

export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden eliminar gastos")
  }

  const { error } = await supabase
    .from("condo_expenses")
    .delete()
    .eq("id", expenseId)

  if (error) {
    console.error("[v0] Error deleting expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/gastos")
  return { success: true }
}
