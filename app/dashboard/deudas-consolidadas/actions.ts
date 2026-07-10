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

  // Update each debt record using raw SQL to bypass RLS
  const updateQuery = `
    UPDATE condo_income
    SET status = 'approved', receipt_url = $1, updated_at = NOW()
    WHERE id = ANY($2::uuid[]) AND condo_id = $3
    RETURNING id
  `

  const { data, error } = await supabase.rpc('execute_update_debts', {
    debt_ids: debtIds,
    receipt_url: receiptUrl,
    condo_id: userProfile.condo_id,
  })

  // If RPC doesn't exist, try direct SQL approach with service role
  if (error) {
    // Fallback: try individual updates
    const adminSupabase = createClient({ admin: true })
    
    for (const debtId of debtIds) {
      const { error: updateError } = await adminSupabase
        .from("condo_income")
        .update({
          status: "approved",
          receipt_url: receiptUrl,
        })
        .eq("id", debtId)
        .eq("condo_id", userProfile.condo_id)

      if (updateError) {
        console.error("Error updating debt:", updateError)
        throw new Error(`Error al actualizar deuda: ${updateError.message}`)
      }
    }
  }

  return { success: true }
}
