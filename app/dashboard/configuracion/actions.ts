"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function regenerateMonthlyIncome(condoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, message: "No autenticado" }
  }

  // Verify user is admin or super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    return { success: false, message: "No tienes permisos para esta acción" }
  }

  // Get parameters for current month
  const { data: parameters } = await supabase
    .from("parameters")
    .select("current_month, current_year, fixed_income_amount, variable_income_amount")
    .eq("condo_id", condoId)
    .single()

  if (!parameters) {
    return { success: false, message: "No se encontraron parámetros del condominio" }
  }

  const { current_month, current_year, fixed_income_amount, variable_income_amount } = parameters

  if (!fixed_income_amount && !variable_income_amount) {
    return { success: false, message: "Configura los montos de gasto común antes de generar" }
  }

  // Get all houses for this condo
  const { data: houses } = await supabase
    .from("houses")
    .select("id, house_number")
    .eq("condo_id", condoId)

  if (!houses || houses.length === 0) {
    return { success: false, message: "No hay casas registradas en este condominio" }
  }

  let created = 0
  let skipped = 0

  for (const house of houses) {
    // Check if fixed income already exists for this house/month
    if (fixed_income_amount > 0) {
      const { data: existingFixed } = await supabase
        .from("condo_income")
        .select("id")
        .eq("house_id", house.id)
        .eq("period_month", current_month)
        .eq("period_year", current_year)
        .eq("income_type", "fixed")
        .single()

      if (!existingFixed) {
        const { error } = await supabase.from("condo_income").insert({
          condo_id: condoId,
          house_id: house.id,
          description: `Gasto Común Fijo - Casa ${house.house_number}`,
          amount: fixed_income_amount,
          income_date: new Date().toISOString().split("T")[0],
          period_month: current_month,
          period_year: current_year,
          income_type: "fixed",
          status: "pending",
          created_by: user.id,
        })
        
        if (!error) created++
      } else {
        skipped++
      }
    }

    // Check if variable income already exists for this house/month
    if (variable_income_amount > 0) {
      const { data: existingVariable } = await supabase
        .from("condo_income")
        .select("id")
        .eq("house_id", house.id)
        .eq("period_month", current_month)
        .eq("period_year", current_year)
        .eq("income_type", "variable")
        .single()

      if (!existingVariable) {
        const { error } = await supabase.from("condo_income").insert({
          condo_id: condoId,
          house_id: house.id,
          description: `Gasto Común Variable - Casa ${house.house_number}`,
          amount: variable_income_amount,
          income_date: new Date().toISOString().split("T")[0],
          period_month: current_month,
          period_year: current_year,
          income_type: "variable",
          status: "pending",
          created_by: user.id,
        })
        
        if (!error) created++
      } else {
        skipped++
      }
    }
  }

  revalidatePath("/dashboard/configuracion")
  revalidatePath("/dashboard/ingresos")
  revalidatePath("/dashboard/mi-casa")

  return { 
    success: true, 
    message: `Se crearon ${created} registros de ingreso. ${skipped} ya existían.` 
  }
}
