"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// ===== Condo Switching =====
export async function switchCondo(condoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Verify user has access to this condo
  const { data: userCondo } = await supabase
    .from("user_condos")
    .select("id")
    .eq("user_id", user.id)
    .eq("condo_id", condoId)
    .single()

  if (!userCondo) throw new Error("No tienes acceso a este condominio")

  // Update user's current condo_id in profiles
  const { error } = await supabase
    .from("profiles")
    .update({ condo_id: condoId })
    .eq("id", user.id)

  if (error) throw error
  revalidatePath("/dashboard")
}
import { redirect } from "next/navigation"

async function getCondoId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  const { data: profile } = await supabase.from("profiles").select("condo_id, role").eq("id", user.id).single()
  if (!profile?.condo_id) throw new Error("Sin condominio")
  return { supabase, userId: user.id, condoId: profile.condo_id, role: profile.role }
}

// ===== Condominiums =====
export async function createCondominium(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error("[v0] Auth error:", authError)
    return { success: false, error: "No autenticado" }
  }

  const name = formData.get("name") as string
  const address = formData.get("address") as string || ""
  const currency = formData.get("currency") as string || "CLP"
  const currency_symbol = formData.get("currency_symbol") as string || "$"
  const currency_multiplier = Number(formData.get("currency_multiplier")) || 1
  const total_houses = Number(formData.get("total_houses")) || 1
  const common_expense_amount = Number(formData.get("common_expense_amount")) || 0
  const payment_deadline_day = Number(formData.get("payment_deadline_day")) || 5

  if (!name) {
    return { success: false, error: "El nombre del condominio es requerido" }
  }

  console.log("[v0] Creating condominium for user:", user.id)

  try {
    // First try with normal client
    const { data: condo, error: condoError } = await supabase
      .from("condominiums")
      .insert({
        name,
        address,
        currency,
        currency_symbol,
        currency_multiplier,
        total_houses,
        common_expense_amount,
        payment_deadline_day,
        created_by: user.id,
      })
      .select()
      .single()

    if (condoError) {
      console.error("[v0] Condo creation error (normal client):", condoError)
      
      // If it fails, try with raw insert using rpc
      console.log("[v0] Attempting with service role...")
      
      // Try using the Supabase JS client with admin privileges
      const { data: adminCondo, error: adminError } = await supabase
        .rpc("create_condominium_admin", {
          p_name: name,
          p_address: address,
          p_currency: currency,
          p_symbol: currency_symbol,
          p_multiplier: currency_multiplier,
          p_houses: total_houses,
          p_expense: common_expense_amount,
          p_deadline: payment_deadline_day,
          p_user_id: user.id,
        })

      if (adminError) {
        console.error("[v0] RPC error:", adminError)
        // Return the original error if RPC also fails
        return { success: false, error: `Error al crear condominio: ${condoError.message}` }
      }

      const newCondoId = adminCondo

      // Update profile with condo_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ condo_id: newCondoId })
        .eq("id", user.id)

      if (profileError) {
        console.error("[v0] Profile update error:", profileError)
        return { success: false, error: `Error al actualizar perfil: ${profileError.message}` }
      }

      revalidatePath("/dashboard", "layout")
      return { success: true, redirect: "/dashboard" }
    }

    console.log("[v0] Condominium created:", condo.id)

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ condo_id: condo.id })
      .eq("id", user.id)

    if (profileError) {
      console.error("[v0] Profile update error:", profileError)
      return { success: false, error: `Error al actualizar perfil: ${profileError.message}` }
    }

    console.log("[v0] Profile updated with condo_id:", condo.id)

    revalidatePath("/dashboard", "layout")
    
    return { success: true, redirect: "/dashboard" }
  } catch (err) {
    console.error("[v0] Unexpected error:", err)
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function updateCondominium(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase
    .from("condominiums")
    .update({
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      currency: formData.get("currency") as string,
      currency_symbol: formData.get("currency_symbol") as string,
      currency_multiplier: Number(formData.get("currency_multiplier")),
      common_expense_amount: Number(formData.get("common_expense_amount")),
      payment_deadline_day: Number(formData.get("payment_deadline_day")),
      cards_public: formData.get("cards_public") === "true",
    })
    .eq("id", condoId)
  if (error) throw error
  revalidatePath("/dashboard")
}

// ===== Expense Types =====
export async function createExpenseType(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("expense_types").insert({
    condo_id: condoId,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  })
  if (error) throw error
  revalidatePath("/dashboard/tipos-gastos")
}

export async function updateExpenseType(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("expense_types")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/tipos-gastos")
}

export async function deleteExpenseType(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("expense_types").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/tipos-gastos")
}

export async function updateExemptionType(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("exemption_types")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/tipos-exoneraciones")
}

export async function deleteExemptionType(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("exemption_types").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/tipos-exoneraciones")
}

// ===== Expenses =====
export async function createExpense(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("expenses").insert({
    condo_id: condoId,
    expense_type_id: formData.get("expense_type_id") as string,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount")),
    expense_date: formData.get("expense_date") as string,
    receipt_url: formData.get("receipt_url") as string || null,
    notes: formData.get("notes") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/gastos")
}

export async function deleteExpense(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("expenses").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/gastos")
}

// ===== Houses =====
export async function createHouse(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("houses").insert({
    condo_id: condoId,
    house_number: formData.get("house_number") as string,
    owner_name: formData.get("owner_name") as string || null,
    owner_email: formData.get("owner_email") as string || null,
    payment_deadline_day: formData.get("payment_deadline_day") ? Number(formData.get("payment_deadline_day")) : null,
  })
  if (error) throw error
  revalidatePath("/dashboard/casas")
}

export async function updateHouse(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("houses")
    .update({
      owner_name: formData.get("owner_name") as string,
      owner_email: formData.get("owner_email") as string,
      payment_deadline_day: formData.get("payment_deadline_day") ? Number(formData.get("payment_deadline_day")) : null,
      avatar_url: formData.get("avatar_url") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/casas")
}

// ===== Payments =====
export async function createPayment(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("payments").insert({
    condo_id: condoId,
    house_id: formData.get("house_id") as string,
    amount: Number(formData.get("amount")),
    payment_date: formData.get("payment_date") as string,
    period_month: Number(formData.get("period_month")),
    period_year: Number(formData.get("period_year")),
    payment_method: formData.get("payment_method") as string,
    receipt_url: formData.get("receipt_url") as string || null,
    notes: formData.get("notes") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/ingresos")
}

export async function verifyPayment(id: string, status: "verificado" | "rechazado") {
  const { supabase, userId } = await getCondoId()
  const { error } = await supabase
    .from("payments")
    .update({ status, verified_by: userId, verified_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/ingresos")
}

// ===== Variable Income =====
export async function createVariableIncome(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("variable_income").insert({
    condo_id: condoId,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount")),
    income_date: formData.get("income_date") as string,
    source: formData.get("source") as string || null,
    receipt_url: formData.get("receipt_url") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/ingreso-variable")
}

// ===== Exemptions =====
export async function createExemptionType(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("exemption_types").insert({
    condo_id: condoId,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
  })
  if (error) throw error
  revalidatePath("/dashboard/exoneraciones")
}

export async function createExemption(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("exemptions").insert({
    condo_id: condoId,
    house_id: formData.get("house_id") as string,
    exemption_type_id: formData.get("exemption_type_id") as string,
    is_permanent: formData.get("is_permanent") === "true",
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string || null,
    percentage: Number(formData.get("percentage")) || 100,
    reason: formData.get("reason") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/exoneraciones")
}

// ===== Projects =====
export async function createProject(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("projects").insert({
    condo_id: condoId,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    improvement_type: formData.get("improvement_type") as string,
    location_description: formData.get("location_description") as string || null,
    location_photo_url: formData.get("location_photo_url") as string || null,
    estimated_cost: Number(formData.get("estimated_cost")) || null,
    start_date: formData.get("start_date") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/proyectos")
}

export async function updateProjectStatus(id: string, status: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("projects").update({ status }).eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/proyectos")
}

export async function addProjectQuote(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("project_quotes").insert({
    project_id: formData.get("project_id") as string,
    vendor_name: formData.get("vendor_name") as string,
    amount: Number(formData.get("amount")),
    description: formData.get("description") as string || null,
    document_url: formData.get("document_url") as string || null,
  })
  if (error) throw error
  revalidatePath("/dashboard/proyectos")
}

// ===== Surveys =====
export async function createSurvey(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const options = JSON.parse(formData.get("options") as string || "[]") as string[]
  const closesAt = formData.get("closes_at") as string
  
  const { data: survey, error } = await supabase
    .from("surveys")
    .insert({
      condo_id: condoId,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      closes_at: closesAt && closesAt.trim() !== "" ? closesAt : null,
      created_by: userId,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error

  if (options.length > 0) {
    await supabase.from("survey_options").insert(
      options.map((opt, i) => ({ survey_id: survey.id, option_text: opt, display_order: i }))
    )
  }

  revalidatePath("/dashboard/encuestas")
}

export async function voteSurvey(surveyId: string, optionId: string) {
  const { supabase, userId } = await getCondoId()
  const { error } = await supabase.from("survey_votes").insert({
    survey_id: surveyId,
    option_id: optionId,
    voter_id: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/encuestas")
}

export async function closeSurvey(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("surveys").update({ is_active: false }).eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/encuestas")
}

export async function updateSurvey(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("surveys")
    .update({
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/encuestas")
}

export async function deleteSurvey(id: string) {
  const { supabase } = await getCondoId()
  // Delete votes first (cascade should handle this, but being explicit)
  await supabase.from("survey_votes").delete().eq("survey_id", id)
  await supabase.from("survey_options").delete().eq("survey_id", id)
  const { error } = await supabase.from("surveys").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/encuestas")
}

// ===== Documents =====
export async function createDocumentType(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("document_types").insert({
    condo_id: condoId,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
  })
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

export async function updateDocumentType(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("document_types")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

export async function deleteDocumentType(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("document_types").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

export async function uploadDocument(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("documents").insert({
    condo_id: condoId,
    document_type_id: formData.get("document_type_id") as string || null,
    title: formData.get("title") as string,
    description: formData.get("description") as string || null,
    file_url: formData.get("file_url") as string,
    uploaded_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

export async function updateDocument(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("documents")
    .update({
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      file_url: formData.get("file_url") as string,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

export async function deleteDocument(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/documentos")
}

// ===== Infractions =====
export async function createInfraction(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("infractions").insert({
    condo_id: condoId,
    house_id: formData.get("house_id") as string,
    description: formData.get("description") as string,
    fine_amount: Number(formData.get("fine_amount")) || 0,
    infraction_date: formData.get("infraction_date") as string,
    evidence_url: formData.get("evidence_url") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/infracciones")
}

export async function markInfractionPaid(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("infractions")
    .update({ is_paid: true, paid_date: new Date().toISOString().split("T")[0] })
    .eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/infracciones")
}

export async function updateInfraction(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("infractions")
    .update({
      description: formData.get("description") as string,
      fine_amount: Number(formData.get("fine_amount")) || 0,
      infraction_date: formData.get("infraction_date") as string,
      notes: formData.get("notes") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/infracciones")
}

export async function deleteInfraction(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("infractions").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/infracciones")
}

// ===== Rentals =====
export async function createRental(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("rentals").insert({
    condo_id: condoId,
    space_name: formData.get("space_name") as string,
    photo_url: formData.get("photo_url") as string || null,
    monthly_amount: Number(formData.get("monthly_amount")) || 0,
    tenant_name: formData.get("tenant_name") as string || null,
    tenant_contact: formData.get("tenant_contact") as string || null,
    start_date: formData.get("start_date") as string || null,
    end_date: formData.get("end_date") as string || null,
  })
  if (error) throw error
  revalidatePath("/dashboard/arriendos")
}

// ===== Common Areas =====
export async function createCommonArea(formData: FormData) {
  const { supabase, condoId } = await getCondoId()
  const { error } = await supabase.from("common_areas").insert({
    condo_id: condoId,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    photo_url: formData.get("photo_url") as string || null,
    is_paid: formData.get("is_paid") === "true",
    usage_fee: Number(formData.get("usage_fee")) || 0,
    maintenance_responsible: formData.get("maintenance_responsible") as string || null,
  })
  if (error) throw error
  revalidatePath("/dashboard/areas-comunes")
}

export async function updateCommonArea(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("common_areas")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      photo_url: formData.get("photo_url") as string || null,
      is_paid: formData.get("is_paid") === "true",
      usage_fee: Number(formData.get("usage_fee")) || 0,
      maintenance_responsible: formData.get("maintenance_responsible") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/areas-comunes")
}

export async function deleteCommonArea(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("common_areas").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/areas-comunes")
}

// ===== Bank Statements =====
export async function uploadBankStatement(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  
  const statementDate = formData.get("statement_date") as string
  const date = new Date(statementDate)
  
  const { error } = await supabase.from("bank_statements").insert({
    condo_id: condoId,
    title: formData.get("title") as string,
    statement_date: statementDate,
    statement_month: date.getMonth() + 1,
    statement_year: date.getFullYear(),
    file_url: formData.get("file_url") as string,
    notes: formData.get("notes") as string || null,
    uploaded_by: userId,
  })
  if (error) {
    console.error("[v0] Error uploading bank statement:", error)
    throw error
  }
  revalidatePath("/dashboard/cartolas")
}

// ===== Alerts =====
export async function createAlert(formData: FormData) {
  const { supabase, userId, condoId } = await getCondoId()
  const { error } = await supabase.from("alerts").insert({
    condo_id: condoId,
    title: formData.get("title") as string,
    message: formData.get("message") as string,
    priority: formData.get("priority") as string || "media",
    expires_at: formData.get("expires_at") as string || null,
    created_by: userId,
  })
  if (error) throw error
  revalidatePath("/dashboard/alertas")
}

export async function updateAlert(formData: FormData) {
  const { supabase } = await getCondoId()
  const { error } = await supabase
    .from("alerts")
    .update({
      title: formData.get("title") as string,
      message: formData.get("message") as string,
      priority: formData.get("priority") as string,
      expires_at: formData.get("expires_at") as string || null,
    })
    .eq("id", formData.get("id") as string)
  if (error) throw error
  revalidatePath("/dashboard/alertas")
}

export async function deleteAlert(id: string) {
  const { supabase } = await getCondoId()
  const { error } = await supabase.from("alerts").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/dashboard/alertas")
}

// ===== File Upload Helper =====
export async function uploadFile(bucket: string, path: string, file: File) {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return urlData.publicUrl
}

// ===== User Management =====
export async function createUser(formData: FormData) {
  const { role: adminRole } = await getCondoId()
  if (adminRole !== "admin") throw new Error("No autorizado")

  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first_name") as string || null
  const lastName = formData.get("last_name") as string || null
  const userRole = formData.get("role") as string || "propietario"
  const houseId = formData.get("house_id") as string || null

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      role: userRole,
    },
  })

  if (authError) throw authError
  if (!authData.user) throw new Error("Error creating user")

  // Profile is auto-created by trigger, but we need to update it with house_id if provided
  if (houseId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ house_id: houseId })
      .eq("id", authData.user.id)
    if (profileError) throw profileError
  }

  revalidatePath("/dashboard/configuracion")
  return { success: true, userId: authData.user.id, email }
}
