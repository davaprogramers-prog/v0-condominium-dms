"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

interface DebtItem {
  id: string
  amount: number | null
}

export async function updateDebtsWithPayment(
  debtIds: string[],
  receiptUrl: string
) {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Usuario no autenticado")
  }

  // Verify user is part of the condo (can see these debts)
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("condo_id")
    .eq("id", user.id)
    .single()

  if (!userProfile) {
    throw new Error("Perfil de usuario no encontrado")
  }

  // Update each debt record
  const updatePromises = debtIds.map((debtId) =>
    supabase
      .from("condo_income")
      .update({
        status: "approved",
        receipt_url: receiptUrl,
      })
      .eq("id", debtId)
      .eq("condo_id", userProfile.condo_id)
  )

  const results = await Promise.all(updatePromises)

  // Check for errors
  for (const result of results) {
    if (result.error) {
      console.error("Error updating debt:", result.error)
      throw new Error(`Error al actualizar deuda: ${result.error.message}`)
    }
  }

  return { success: true }
}
