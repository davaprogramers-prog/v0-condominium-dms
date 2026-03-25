"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createCondoIncome(
  condoId: string,
  formData: {
    houseId?: string
    amount: number
    incomeType: "cuota" | "variable"
    incomeDate: string
    description?: string
    receiptUrl?: string
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

  if (profile?.role !== "admin" || profile?.condo_id !== condoId) {
    throw new Error("No tienes permisos para crear ingresos")
  }

  // Get period from income date
  const date = new Date(formData.incomeDate)
  const periodYear = date.getFullYear()
  const periodMonth = date.getMonth() + 1

  const { error } = await supabase
    .from("condo_income")
    .insert({
      condo_id: condoId,
      house_id: formData.houseId || null,
      amount: formData.amount,
      income_type: formData.incomeType,
      income_date: formData.incomeDate,
      period_year: periodYear,
      period_month: periodMonth,
      description: formData.description,
      receipt_url: formData.receiptUrl,
      created_by: user.id,
    })

  if (error) {
    console.error("[v0] Error creating income:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/ingresos")
  return { success: true }
}

export async function updateIncome(
  incomeId: string,
  formData: {
    amount: number
    incomeDate: string
    description?: string
    receiptUrl?: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    throw new Error("Solo administradores pueden editar ingresos")
  }

  // Get period from income date
  const date = new Date(formData.incomeDate)
  const periodYear = date.getFullYear()
  const periodMonth = date.getMonth() + 1

  const { error } = await supabase
    .from("condo_income")
    .update({
      amount: formData.amount,
      income_date: formData.incomeDate,
      period_year: periodYear,
      period_month: periodMonth,
      description: formData.description,
      receipt_url: formData.receiptUrl,
    })
    .eq("id", incomeId)

  if (error) {
    console.error("[v0] Error updating income:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/ingresos")
  return { success: true }
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

export async function getHouses(condoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("houses")
    .select("id, house_number, owner_name")
    .eq("condo_id", condoId)
    .order("house_number")

  if (error) {
    console.error("[v0] Error fetching houses:", error)
    return []
  }

  return data || []
}
