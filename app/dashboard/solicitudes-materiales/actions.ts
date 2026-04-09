'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createMaterialRequest(condoId: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    // Format items as description
    const itemsDescription = data.items
      .map((item: any) => `${item.quantity} - ${item.description}`)
      .join('\n')

    const { error } = await supabase
      .from("supply_requests")
      .insert([
        {
          condo_id: condoId,
          created_by: user.id,
          request_title: data.request_title,
          request_description: itemsDescription,
          request_category: "supplies",
          quantity: data.items.length,
          unit_price: 0,
          estimated_cost: 0,
          priority: "normal",
          status: "pending",
        },
      ])

    if (error) {
      console.error("[v0] Error creating material request:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/solicitudes-materiales")
    return { success: true }
  } catch (e) {
    console.error("[v0] Exception creating material request:", e)
    return { error: String(e) }
  }
}

export async function updateMaterialRequest(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    const itemsDescription = data.items
      .map((item: any) => `${item.quantity} - ${item.description}`)
      .join('\n')

    const { error } = await supabase
      .from("supply_requests")
      .update({
        request_title: data.request_title,
        request_description: itemsDescription,
        quantity: data.items.length,
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating material request:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/solicitudes-materiales")
    return { success: true }
  } catch (e) {
    console.error("[v0] Exception updating material request:", e)
    return { error: String(e) }
  }
}

export async function deleteMaterialRequest(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    const { error } = await supabase
      .from("supply_requests")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting material request:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/solicitudes-materiales")
    return { success: true }
  } catch (e) {
    console.error("[v0] Exception deleting material request:", e)
    return { error: String(e) }
  }
}

export async function updateMaterialRequestStatus(id: string, status: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: "No autenticado" }
    }

    const { error } = await supabase
      .from("supply_requests")
      .update({ status })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating status:", error)
      return { error: error.message }
    }

    revalidatePath("/dashboard/solicitudes-materiales")
    return { success: true }
  } catch (e) {
    console.error("[v0] Exception updating status:", e)
    return { error: String(e) }
  }
}
