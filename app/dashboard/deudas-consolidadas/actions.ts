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

  // Call RPC function to update debts
  const { data: rpcResult, error: rpcError } = await supabase.rpc(
    'update_debts_with_payment',
    {
      debt_ids: debtIds,
      receipt_url: receiptUrl,
      condo_id: userProfile.condo_id,
    }
  )

  if (rpcError) {
    console.error("Error calling RPC:", rpcError)
    
    // Fallback: Create a payment proof record instead
    const { error: insertError } = await supabase
      .from("payment_proofs")
      .insert({
        condo_id: userProfile.condo_id,
        debt_ids: debtIds,
        receipt_url: receiptUrl,
        status: "pending_approval",
      })

    if (insertError) {
      throw new Error(`Error al registrar pago: ${insertError.message}`)
    }
  } else if (!rpcResult || rpcResult.length === 0) {
    throw new Error("No se pudieron actualizar las deudas")
  }

  return { success: true }
}
