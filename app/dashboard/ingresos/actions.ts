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

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"
  const canAccessCondo = profile?.condo_id === condoId || profile?.role === "super_admin"
  
  if (!isAdmin || !canAccessCondo) {
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

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
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

export async function getCondoIncome(condoId: string, year?: number, month?: number, incomeType?: string) {
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
  // Filter by income type - default to "cuota" for regular income page
  if (incomeType) {
    query = query.eq("income_type", incomeType)
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

// Payment approval/rejection functions
export async function registerPaymentProof(
  condoId: string,
  houseId: string,
  formData: {
    amount: number
    paymentDate: string
    incomeType: "cuota" | "variable"
    description?: string
    receiptUrl: string
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get period from payment date
  const date = new Date(formData.paymentDate)
  const periodYear = date.getFullYear()
  const periodMonth = date.getMonth() + 1

  // Create income with pending status
  const { data: income, error: incomeError } = await supabase
    .from("condo_income")
    .insert({
      condo_id: condoId,
      house_id: houseId,
      amount: formData.amount,
      income_type: formData.incomeType,
      income_date: formData.paymentDate,
      period_year: periodYear,
      period_month: periodMonth,
      description: formData.description,
      receipt_url: formData.receiptUrl,
      status: "pending",
      created_by: user.id,
    })
    .select()
    .single()

  if (incomeError) {
    console.error("[v0] Error registering payment:", incomeError)
    throw new Error(incomeError.message)
  }

  // Create notification for admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("condo_id", condoId)
    .eq("role", "admin")
    .single()

  if (adminProfile) {
    await supabase.from("notifications").insert({
      condo_id: condoId,
      user_id: adminProfile.id,
      type: "payment_pending",
      reference_id: income.id,
      reference_type: "income",
      title: `Pago pendiente de aprobación - Casa ${houseId}`,
      message: `Se registró un pago de $${formData.amount.toLocaleString("es-CL")} el ${new Date(formData.paymentDate).toLocaleDateString("es-CL")}`,
    })
  }

  revalidatePath("/dashboard/mi-casa/pagos")
  return { success: true, income }
}

export async function approvePayment(incomeId: string, condoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden aprobar pagos")
  }

  const { error } = await supabase
    .from("condo_income")
    .update({
      status: "approved",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", incomeId)

  if (error) {
    console.error("[v0] Error approving payment:", error)
    throw new Error(error.message)
  }

  // Mark notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("reference_id", incomeId)

  revalidatePath("/dashboard/ingresos")
  return { success: true }
}

export async function rejectPayment(incomeId: string, condoId: string, reason?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden rechazar pagos")
  }

  const { error } = await supabase
    .from("condo_income")
    .update({
      status: "rejected",
      rejection_reason: reason || null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", incomeId)

  if (error) {
    console.error("[v0] Error rejecting payment:", error)
    throw new Error(error.message)
  }

  // Mark notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("reference_id", incomeId)

  revalidatePath("/dashboard/ingresos")
  return { success: true }
}

export async function getNotifications(condoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    console.error("[v0] Error fetching notifications:", error)
    return []
  }

  return data || []
}

export async function getUnreadNotificationsCount(condoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .eq("is_read", false)

  if (error) {
    console.error("[v0] Error fetching unread count:", error)
    return 0
  }

  return count || 0
}

export async function deleteIncome(incomeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden eliminar ingresos")
  }

  // Delete the income record (reverses to pending by just removing the record)
  const { error } = await supabase
    .from("condo_income")
    .delete()
    .eq("id", incomeId)

  if (error) {
    console.error("[v0] Error deleting income:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/ingresos")
  return { success: true }
}

export async function deleteVariableIncome(incomeId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    throw new Error("Solo administradores pueden eliminar ingresos variables")
  }

  // Delete the income record
  const { error } = await supabase
    .from("condo_income")
    .delete()
    .eq("id", incomeId)

  if (error) {
    console.error("[v0] Error deleting variable income:", error)
    throw new Error(error.message)
  }

  revalidatePath("/dashboard/ingreso-variable")
  return { success: true }
}

