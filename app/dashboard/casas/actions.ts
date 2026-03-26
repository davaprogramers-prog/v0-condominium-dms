"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createHouse(
  condoId: string,
  formData: {
    houseNumber: number
    ownerName: string
    ownerEmail: string
    ownerPhone?: string
    paymentDueDay?: number
  }
) {
  const supabase = await createClient()
  
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No authenticated")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const canAccessCondo = profile?.condo_id === condoId || profile?.role === "super_admin"
  
  if (!isAdmin || !canAccessCondo) {
    throw new Error("No tienes permisos para crear casas")
  }

  // Insert house with only existing columns
  const { data: house, error: houseError } = await supabase
    .from("houses")
    .insert({
      condo_id: condoId,
      house_number: formData.houseNumber,
      owner_name: formData.ownerName,
      owner_email: formData.ownerEmail,
      payment_due_day: formData.paymentDueDay || 5,
    })
    .select()
    .single()

  if (houseError) {
    console.error("[v0] Error creating house:", houseError)
    throw new Error(houseError.message)
  }

  // Auto-generate income for this house based on parameters
  const { data: parameters } = await supabase
    .from("parameters")
    .select("current_month, current_year, fixed_income_amount, variable_income_amount")
    .eq("condo_id", condoId)
    .single()

  if (parameters && house) {
    const { current_month, current_year, fixed_income_amount, variable_income_amount } = parameters

    // Create fixed income if configured
    if (fixed_income_amount > 0) {
      await supabase.from("condo_income").insert({
        condo_id: condoId,
        house_id: house.id,
        description: `Gasto Común Fijo - Casa ${formData.houseNumber}`,
        amount: fixed_income_amount,
        income_date: new Date().toISOString().split("T")[0],
        period_month: current_month,
        period_year: current_year,
        income_type: "fixed",
        status: "pending",
        created_by: user.id,
      })
    }

    // Create variable income if configured
    if (variable_income_amount > 0) {
      await supabase.from("condo_income").insert({
        condo_id: condoId,
        house_id: house.id,
        description: `Gasto Común Variable - Casa ${formData.houseNumber}`,
        amount: variable_income_amount,
        income_date: new Date().toISOString().split("T")[0],
        period_month: current_month,
        period_year: current_year,
        income_type: "variable",
        status: "pending",
        created_by: user.id,
      })
    }
  }

  revalidatePath("/dashboard/casas")
  revalidatePath("/dashboard/ingresos")
  return { success: true }
}

export async function updateHouse(
  houseId: string,
  formData: {
    ownerName: string
    ownerEmail: string
    ownerPhone?: string
    paymentDueDay?: number
  }
) {
  const supabase = await createClient()
  
  // Verify user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No authenticated")

  const { data: house } = await supabase
    .from("houses")
    .select("condo_id")
    .eq("id", houseId)
    .single()

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, condo_id")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const canAccessCondo = profile?.condo_id === house?.condo_id || profile?.role === "super_admin"
  
  if (!isAdmin || !canAccessCondo) {
    throw new Error("No tienes permisos para editar casas")
  }

  // Update house with only existing columns
  const { error: houseError } = await supabase
    .from("houses")
    .update({
      owner_name: formData.ownerName,
      owner_email: formData.ownerEmail,
      payment_due_day: formData.paymentDueDay || 5,
    })
    .eq("id", houseId)

  if (houseError) {
    console.error("[v0] Error updating house:", houseError)
    throw new Error(houseError.message)
  }

  revalidatePath("/dashboard/casas")
  return { success: true }
}

