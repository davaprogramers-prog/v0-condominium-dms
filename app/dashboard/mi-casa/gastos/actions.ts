"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createExpense(
  houseId: string,
  formData: {
    title: string
    description: string
    amount: number
    expenseDate: string
    category: string
    receiptUrl?: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: house } = await supabase
    .from("houses")
    .select("condo_id")
    .eq("id", houseId)
    .single()

  const { error } = await supabase
    .from("house_expenses")
    .insert({
      house_id: houseId,
      condo_id: house?.condo_id,
      title: formData.title,
      description: formData.description,
      amount: formData.amount,
      expense_date: formData.expenseDate,
      category: formData.category,
      receipt_url: formData.receiptUrl,
      created_by: user.id,
    })

  if (error) {
    console.error("[v0] Error creating expense:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/mi-casa/gastos")
  return { success: true }
}

export async function getExpenses(houseId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("house_expenses")
    .select("*")
    .eq("house_id", houseId)
    .order("expense_date", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching expenses:", error)
    return []
  }

  return data || []
}

