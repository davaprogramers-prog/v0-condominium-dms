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

  // Get active exemptions for this condo to apply discounts per house
  const { data: exemptions } = await supabase
    .from("exemptions")
    .select("house_id, fixed_percentage, variable_percentage, is_permanent, start_date, end_date")
    .eq("condo_id", condoId)

  // Build a reference date for the period being generated (last day of the month)
  const periodEnd = new Date(current_year, current_month, 0) // day 0 of next month = last day of current
  const periodStart = new Date(current_year, current_month - 1, 1)

  // Map house_id -> { fixed, variable } exemption percentages (highest active value wins)
  const exemptionByHouse = new Map<string, { fixed: number; variable: number }>()
  for (const ex of exemptions || []) {
    const start = ex.start_date ? new Date(ex.start_date) : null
    const end = ex.end_date ? new Date(ex.end_date) : null
    // Exemption is active for the period if permanent, or its date range overlaps the period
    const startsInTime = !start || start <= periodEnd
    const endsInTime = ex.is_permanent || !end || end >= periodStart
    if (!startsInTime || !endsInTime) continue

    const current = exemptionByHouse.get(ex.house_id as string) || { fixed: 0, variable: 0 }
    exemptionByHouse.set(ex.house_id as string, {
      fixed: Math.max(current.fixed, Number(ex.fixed_percentage) || 0),
      variable: Math.max(current.variable, Number(ex.variable_percentage) || 0),
    })
  }

  let created = 0
  let skipped = 0
  let exemptedFully = 0

  for (const house of houses) {
    const houseExemption = exemptionByHouse.get(house.id) || { fixed: 0, variable: 0 }
    // Calculate effective amounts after exemption
    const effectiveFixed = Math.round(fixed_income_amount * (1 - houseExemption.fixed / 100))
    const effectiveVariable = Math.round(variable_income_amount * (1 - houseExemption.variable / 100))

    // Check if fixed income already exists for this house/month
    if (fixed_income_amount > 0 && effectiveFixed > 0) {
      const { data: existingFixed } = await supabase
        .from("condo_income")
        .select("id")
        .eq("house_id", house.id)
        .eq("period_month", current_month)
        .eq("period_year", current_year)
        .eq("income_type", "fixed")
        .single()

      if (!existingFixed) {
        const exemptNote = houseExemption.fixed > 0 ? ` (exonerado ${houseExemption.fixed}%)` : ""
        const { error } = await supabase.from("condo_income").insert({
          condo_id: condoId,
          house_id: house.id,
          description: `Gasto Común Fijo - Casa ${house.house_number}${exemptNote}`,
          amount: effectiveFixed,
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
    } else if (fixed_income_amount > 0 && effectiveFixed === 0) {
      // 100% exempt from fixed expense - nothing to generate
      exemptedFully++
    }

    // Check if variable income already exists for this house/month
    if (variable_income_amount > 0 && effectiveVariable > 0) {
      const { data: existingVariable } = await supabase
        .from("condo_income")
        .select("id")
        .eq("house_id", house.id)
        .eq("period_month", current_month)
        .eq("period_year", current_year)
        .eq("income_type", "variable")
        .single()

      if (!existingVariable) {
        const exemptNote = houseExemption.variable > 0 ? ` (exonerado ${houseExemption.variable}%)` : ""
        const { error } = await supabase.from("condo_income").insert({
          condo_id: condoId,
          house_id: house.id,
          description: `Gasto Común Variable - Casa ${house.house_number}${exemptNote}`,
          amount: effectiveVariable,
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
    } else if (variable_income_amount > 0 && effectiveVariable === 0) {
      // 100% exempt from variable expense - nothing to generate
      exemptedFully++
    }
  }

  revalidatePath("/dashboard/configuracion")
  revalidatePath("/dashboard/ingresos")
  revalidatePath("/dashboard/mi-casa")

  const exemptMsg = exemptedFully > 0 ? ` ${exemptedFully} cargos no se generaron por exoneración del 100%.` : ""
  return { 
    success: true, 
    message: `Se crearon ${created} registros de ingreso. ${skipped} ya existían.${exemptMsg}` 
  }
}
