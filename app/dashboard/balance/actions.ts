"use server"

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Save monthly balance to database
export async function saveMonthlyBalance(
  condoId: string,
  year: number,
  month: number,
  balanceData: {
    saldo_anterior: number
    ingresos_recaudados: number
    gastos: number
    balance_mes: number
    saldo_final: number
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("monthly_balances")
    .upsert({
      condo_id: condoId,
      year,
      month,
      ...balanceData,
      updated_at: new Date(),
    }, {
      onConflict: "condo_id,year,month"
    })

  if (error) {
    console.error("[v0] Error saving monthly balance:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/balance")
}

// Get previous month's balance to use as saldo_anterior
export async function getPreviousMonthBalance(
  condoId: string,
  year: number,
  month: number
) {
  const supabase = await createClient()

  let prevYear = year
  let prevMonth = month - 1

  // If month is January, previous month is December of previous year
  if (month === 1) {
    prevYear--
    prevMonth = 12
  }

  const { data, error } = await supabase
    .from("monthly_balances")
    .select("saldo_final")
    .eq("condo_id", condoId)
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .single()

  if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
    console.error("[v0] Error fetching previous balance:", error)
    throw new Error(error.message)
  }

  return data?.saldo_final || null
}

// Get monthly balance from database
export async function getMonthlyBalance(
  condoId: string,
  year: number,
  month: number
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("monthly_balances")
    .select("*")
    .eq("condo_id", condoId)
    .eq("year", year)
    .eq("month", month)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("[v0] Error fetching monthly balance:", error)
    throw new Error(error.message)
  }

  return data || null
}
