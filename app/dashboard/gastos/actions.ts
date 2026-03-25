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

  if (profile?.role !== "admin" || profile?.condo_id !== condoId) {
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

  let query = supabase
    .from("condo_expenses")
    .select("*")
    .eq("condo_id", condoId)

  if (year) {
    query = query.eq("period_year", year)
  }
  if (month) {
    query = query.eq("period_month", month)
  }

  const { data, error } = await query.order("expense_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching expenses:", error)
    return []
  }

  return data || []
}

export async function getCondoIncome(condoId: string, year?: number, month?: number) {
  const supabase = await createClient()

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
    console.error("[v0] Error fetching income:", error)
    return []
  }

  return data || []
}

export async function getCondoBalance(condoId: string, year: number, month: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("condo_monthly_balance")
    .select("*")
    .eq("condo_id", condoId)
    .eq("period_year", year)
    .eq("period_month", month)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[v0] Error fetching balance:", error)
  }

  return data || null
}
