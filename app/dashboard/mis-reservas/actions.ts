"use server"

import { esSuperAdminEfectivo } from "@/lib/auth/plataforma/guardia"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { exigirEdicionDemoPermitida, exigirNoEliminarDemo } from "@/lib/demo/guardia"
import { puedeRechazarReservas } from "@/lib/reservas/permisos"

type ContextoReservas = {
  userId: string
  rol: string | null
  condoId: string | null
  houseId: string | null
  esSuperAdmin: boolean
}

/** Rol, condominio y casa leídos de la BD con la sesión verificada; nunca se confía en flags del cliente. */
async function contextoReservas(): Promise<ContextoReservas> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  const { data: perfil } = await createServiceClient()
    .from("profiles")
    .select("role, condo_id, house_id")
    .eq("id", user.id)
    .maybeSingle()
  const esSuperAdmin = perfil?.role === "super_admin" && (await esSuperAdminEfectivo())
  return {
    userId: user.id,
    rol: perfil?.role ?? null,
    condoId: perfil?.condo_id ?? null,
    houseId: perfil?.house_id ?? null,
    esSuperAdmin,
  }
}

function gestionaCondominio(ctx: ContextoReservas, condoId: string | null | undefined) {
  if (ctx.esSuperAdmin) return true
  return !!condoId && ["admin", "conserje"].includes(ctx.rol ?? "") && ctx.condoId === condoId
}

function esDuenoReserva(ctx: ContextoReservas, reserva: { house_id?: string | null; created_by?: string | null }) {
  return (!!ctx.houseId && reserva.house_id === ctx.houseId) || reserva.created_by === ctx.userId
}

interface CreateReservationData {
  area_id: string
  house_id: string
  condo_id: string
  reservation_date: string
  start_time: string
  end_time: string
  notes?: string
}

interface UpdateReservationData {
  reservation_id: string
  start_time: string
  end_time: string
  notes?: string
}

// Helper to check if times overlap considering reception/delivery buffer
function timesOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
  receptionMinutes: number,
  deliveryMinutes: number
): boolean {
  // Convert times to minutes for easier comparison
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  // Calculate effective times with buffer
  const newStartMin = toMinutes(newStart) - receptionMinutes
  const newEndMin = toMinutes(newEnd) + deliveryMinutes
  const existingStartMin = toMinutes(existingStart) - receptionMinutes
  const existingEndMin = toMinutes(existingEnd) + deliveryMinutes

  // Check for overlap
  return newStartMin < existingEndMin && newEndMin > existingStartMin
}

// Helper to check if user can modify reservation (time limit check)
function canModifyReservation(
  reservationDate: string,
  startTime: string,
  minHoursToModify: number
): boolean {
  const now = new Date()
  const reservationDateTime = new Date(`${reservationDate}T${startTime}`)
  const hoursUntilReservation = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntilReservation >= minHoursToModify
}

// Helper to validate reservation hours
function validateReservationHours(
  startTime: string,
  endTime: string,
  maxHours: number,
  openingTime: string,
  closingTime: string
): { valid: boolean; error?: string } {
  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  const startMin = toMinutes(startTime)
  const endMin = toMinutes(endTime)
  const openMin = toMinutes(openingTime)
  let closeMin = toMinutes(closingTime)
  
  // Validate 30-minute intervals
  if (startMin % 30 !== 0 || endMin % 30 !== 0) {
    return { valid: false, error: "Los horarios deben ser en intervalos de 30 minutos (ej: 10:00, 10:30, 11:00)" }
  }
  
  // Handle midnight (00:00) as end of day (24:00 = 1440 minutes)
  if (closeMin === 0) {
    closeMin = 24 * 60 // 1440 minutes = midnight
  }

  if (startMin >= endMin) {
    return { valid: false, error: "La hora de inicio debe ser anterior a la hora de fin" }
  }

  if (startMin < openMin || endMin > closeMin) {
    return { valid: false, error: `El horario debe estar entre ${openingTime} y ${closingTime === "00:00" ? "24:00" : closingTime}` }
  }

  const durationHours = (endMin - startMin) / 60
  if (durationHours > maxHours) {
    return { valid: false, error: `La reserva no puede exceder ${maxHours} horas` }
  }

  return { valid: true }
}

export async function createReservation(data: CreateReservationData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get area configuration
  const { data: area, error: areaError } = await supabase
    .from("common_areas")
    .select("*")
    .eq("id", data.area_id)
    .single()

  if (areaError || !area) throw new Error("Área no encontrada")
  if (!area.is_reservable) throw new Error("Esta área no permite reservas")

  // Validate hours
  const validation = validateReservationHours(
    data.start_time,
    data.end_time,
    area.max_hours_per_reservation || 2,
    area.opening_time || "08:00",
    area.closing_time || "22:00"
  )
  if (!validation.valid) throw new Error(validation.error)

  // Check for existing reservations on that date (use service client to bypass RLS)
  const serviceClient = createServiceClient()

  // Antes de consultar reservas ajenas: el condominio sale del área (BD), no del cliente,
  // y la casa debe ser de ese mismo condominio.
  const ctx = await contextoReservas()
  const { data: casa } = await serviceClient
    .from("houses")
    .select("id")
    .eq("id", data.house_id)
    .eq("condo_id", area.condo_id)
    .maybeSingle()
  if (!casa) throw new Error("No tienes permisos para crear reservas para esta propiedad.")
  if (!gestionaCondominio(ctx, area.condo_id) && ctx.houseId !== data.house_id) {
    throw new Error("No tienes permisos para crear reservas para esta propiedad.")
  }

  // Check if this house already has a reservation for this date (any area)
  const { data: houseReservations } = await serviceClient
    .from("area_reservations")
    .select("*, common_areas(name)")
    .eq("house_id", data.house_id)
    .eq("reservation_date", data.reservation_date)
    .in("status", ["confirmed", "pending"])
  
  if (houseReservations && houseReservations.length > 0) {
    const existing = houseReservations[0]
    const areaName = existing.common_areas?.name || "un área común"
    throw new Error(
      `Tu propiedad ya tiene una reserva para este día.\n` +
      `Reserva existente: ${areaName} de ${existing.start_time.substring(0,5)} a ${existing.end_time.substring(0,5)}.\n` +
      `Solo se permite una reserva por día por propiedad.`
    )
  }
  
  // Check for time conflicts in this specific area (including pending reservations)
  const { data: existingReservations } = await serviceClient
    .from("area_reservations")
    .select("*")
    .eq("area_id", data.area_id)
    .eq("reservation_date", data.reservation_date)
    .in("status", ["confirmed", "pending"])

  // Check for conflicts and suggest available times
  if (existingReservations && existingReservations.length > 0) {
    const receptionMin = area.reception_time_minutes || 30
    const deliveryMin = area.delivery_time_minutes || 30
    const maxHours = area.max_hours_per_reservation || 2
    
    for (const existing of existingReservations) {
      if (timesOverlap(
        data.start_time,
        data.end_time,
        existing.start_time,
        existing.end_time,
        receptionMin,
        deliveryMin
      )) {
        // Calculate suggested times
        const toMinutes = (time: string) => {
          const [h, m] = time.split(":").map(Number)
          return h * 60 + m
        }
        const formatTime = (mins: number) => {
          const h = Math.floor(mins / 60)
          const m = mins % 60
          return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        }
        
        const existingStartMin = toMinutes(existing.start_time)
        const existingEndMin = toMinutes(existing.end_time)
        const openMin = toMinutes(area.opening_time || "08:00")
        let closeMin = toMinutes(area.closing_time || "22:00")
        if (closeMin === 0) closeMin = 24 * 60
        
        // Suggest time before the existing reservation
        // New reservation must end early enough so that: endTime + deliveryMin <= existingStartMin - receptionMin
        // So: endTime <= existingStartMin - receptionMin - deliveryMin
        const suggestEndBefore = existingStartMin - receptionMin - deliveryMin
        const suggestStartBefore = Math.max(openMin, suggestEndBefore - (maxHours * 60))
        
        // Suggest time after the existing reservation
        // New reservation must start late enough so that: startTime - receptionMin >= existingEndMin + deliveryMin
        // So: startTime >= existingEndMin + deliveryMin + receptionMin
        const suggestStartAfter = existingEndMin + deliveryMin + receptionMin
        const suggestEndAfter = Math.min(closeMin, suggestStartAfter + (maxHours * 60))
        
        let suggestions = `\n\nHorarios disponibles sugeridos:`
        if (suggestEndBefore > openMin && (suggestEndBefore - suggestStartBefore) >= 60) {
          suggestions += `\n- Antes: ${formatTime(suggestStartBefore)} a ${formatTime(suggestEndBefore)}`
        }
        if (suggestStartAfter < closeMin && (suggestEndAfter - suggestStartAfter) >= 60) {
          suggestions += `\n- Después: ${formatTime(suggestStartAfter)} a ${formatTime(suggestEndAfter)}`
        }
        
        throw new Error(
          `El horario solicitado no está disponible.\n` +
          `Ya existe una reserva de ${existing.start_time.substring(0,5)} a ${existing.end_time.substring(0,5)}.` +
          suggestions
        )
      }
    }
  }



  // Create reservation using service client to bypass RLS (we already validated permissions above)
  // Status is "pending" - requires admin/conserje confirmation
  const { error } = await serviceClient.from("area_reservations").insert({
    area_id: data.area_id,
    house_id: data.house_id,
    condo_id: area.condo_id,
    reservation_date: data.reservation_date,
    start_time: data.start_time,
    end_time: data.end_time,
    notes: data.notes || null,
    created_by: user.id,
    status: "pending",
  })

  if (error) {
    throw new Error(error.message || "Error al crear la reserva")
  }
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

export async function updateReservation(data: UpdateReservationData, isAdminOrConcierge: boolean = false) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get the reservation using service client to bypass RLS
  const { data: reservation, error: reservationError } = await serviceClient
    .from("area_reservations")
    .select("*, common_areas(*)")
    .eq("id", data.reservation_id)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")

  const area = reservation.common_areas

  // isAdminOrConcierge llega del cliente y se ignora: el permiso se calcula en el servidor.
  void isAdminOrConcierge
  const ctx = await contextoReservas()
  const gestor = gestionaCondominio(ctx, reservation.condo_id ?? area?.condo_id)
  if (!gestor && !esDuenoReserva(ctx, reservation)) throw new Error("Reserva no encontrada")
  await exigirEdicionDemoPermitida("area_reservations", reservation.id)

  // Check modification time limit for non-admin users
  if (!gestor) {
    if (!canModifyReservation(
      reservation.reservation_date,
      reservation.start_time,
      area.min_hours_to_modify || 12
    )) {
      throw new Error(`No puedes modificar la reserva con menos de ${area.min_hours_to_modify || 12} horas de anticipación`)
    }
  }

  // Validate hours
  const validation = validateReservationHours(
    data.start_time,
    data.end_time,
    area.max_hours_per_reservation || 2,
    area.opening_time || "08:00",
    area.closing_time || "22:00"
  )
  if (!validation.valid) throw new Error(validation.error)

  // Check for conflicts with other reservations (excluding current one) - use service client
  const { data: existingReservations } = await serviceClient
    .from("area_reservations")
    .select("*")
    .eq("area_id", reservation.area_id)
    .eq("reservation_date", reservation.reservation_date)
    .eq("status", "confirmed")
    .neq("id", data.reservation_id)

  if (existingReservations && existingReservations.length > 0) {
    for (const existing of existingReservations) {
      if (timesOverlap(
        data.start_time,
        data.end_time,
        existing.start_time,
        existing.end_time,
        area.reception_time_minutes || 30,
        area.delivery_time_minutes || 30
      )) {
        throw new Error("El nuevo horario tiene conflicto con otra reserva existente")
      }
    }
  }

  // Update reservation using service client
  const { error } = await serviceClient
    .from("area_reservations")
    .update({
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes || null,
      modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.reservation_id)

  if (error) throw error
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

export async function cancelReservation(reservationId: string, isAdminOrConcierge: boolean = false) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  await exigirNoEliminarDemo()

  // Get the reservation using service client to bypass RLS
  const { data: reservation, error: reservationError } = await serviceClient
    .from("area_reservations")
    .select("*, common_areas(*)")
    .eq("id", reservationId)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")

  const area = reservation.common_areas

  void isAdminOrConcierge
  const ctx = await contextoReservas()
  const gestor = gestionaCondominio(ctx, reservation.condo_id ?? area?.condo_id)
  if (!gestor && !esDuenoReserva(ctx, reservation)) throw new Error("Reserva no encontrada")

  // Check modification time limit for non-admin users
  if (!gestor) {
    if (!canModifyReservation(
      reservation.reservation_date,
      reservation.start_time,
      area.min_hours_to_modify || 12
    )) {
      throw new Error(`No puedes cancelar la reserva con menos de ${area.min_hours_to_modify || 12} horas de anticipación`)
    }
  }

  // Cancel reservation (soft delete by changing status) - use service client
  const { error } = await serviceClient
    .from("area_reservations")
    .update({
      status: "cancelled",
      modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)

  if (error) throw error
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

// Admin/Conserje function to confirm a pending reservation
export async function confirmReservation(reservationId: string) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !(["admin", "conserje"].includes(profile.role) || ((profile.role === "super_admin" && (await esSuperAdminEfectivo())) && (await esSuperAdminEfectivo())))) {
    throw new Error("No tienes permisos para confirmar reservas")
  }

  // Get the reservation
  const { data: reservation, error: reservationError } = await serviceClient
    .from("area_reservations")
    .select("*")
    .eq("id", reservationId)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")
  if (!gestionaCondominio(await contextoReservas(), reservation.condo_id)) throw new Error("Reserva no encontrada")
  await exigirEdicionDemoPermitida("area_reservations", reservation.id)

  if (reservation.status !== "pending") {
    throw new Error("Solo se pueden confirmar reservas pendientes")
  }

  // Confirm reservation
  const { error } = await serviceClient
    .from("area_reservations")
    .update({
      status: "confirmed",
      modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)

  if (error) throw error
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

// Solo el administrador del condominio (o super admin efectivo) rechaza reservas; el conserje no.
export async function rejectReservation(reservationId: string, reason: string) {
  const serviceClient = createServiceClient()
  const ctx = await contextoReservas()

  if (!puedeRechazarReservas(ctx.rol, ctx.esSuperAdmin)) {
    throw new Error("Solo el administrador puede rechazar reservas")
  }

  if (!reason || reason.trim().length === 0) {
    throw new Error("Debes indicar la razón del rechazo")
  }

  // Get the reservation
  const { data: reservation, error: reservationError } = await serviceClient
    .from("area_reservations")
    .select("*")
    .eq("id", reservationId)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")
  if (!gestionaCondominio(ctx, reservation.condo_id)) throw new Error("Reserva no encontrada")
  await exigirEdicionDemoPermitida("area_reservations", reservation.id)

  // Reject reservation - change status to "rejected" and store reason in notes
  const { error } = await serviceClient
    .from("area_reservations")
    .update({
      status: "rejected",
      notes: `RECHAZADA: ${reason}${reservation.notes ? `\n\nNota original: ${reservation.notes}` : ""}`,
      modified_by: ctx.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)

  if (error) throw error
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

// Admin function to change house for a reservation
export async function changeReservationHouse(reservationId: string, newHouseId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !(["admin", "conserje"].includes(profile.role) || ((profile.role === "super_admin" && (await esSuperAdminEfectivo())) && (await esSuperAdminEfectivo())))) {
    throw new Error("No tienes permisos para realizar esta acción")
  }

  const serviceClient = createServiceClient()
  const { data: reserva } = await serviceClient.from("area_reservations").select("id, condo_id").eq("id", reservationId).maybeSingle()
  if (!reserva || !gestionaCondominio(await contextoReservas(), reserva.condo_id)) throw new Error("Reserva no encontrada")
  await exigirEdicionDemoPermitida("area_reservations", reserva.id)
  const { data: casa } = await serviceClient.from("houses").select("id").eq("id", newHouseId).eq("condo_id", reserva.condo_id).maybeSingle()
  if (!casa) throw new Error("La casa no pertenece a este condominio")

  const { error } = await supabase
    .from("area_reservations")
    .update({
      house_id: newHouseId,
      modified_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reservationId)

  if (error) throw error
  
  revalidatePath("/dashboard/mis-reservas")
  revalidatePath("/dashboard/areas-comunes")
  return { success: true }
}

// Get available time slots for a specific date and area
export async function getAvailableSlots(areaId: string, date: string) {
  const supabase = await createClient()

  // Get area configuration
  const { data: area } = await supabase
    .from("common_areas")
    .select("*")
    .eq("id", areaId)
    .single()

  if (!area) return { slots: [], area: null }

  // Get existing reservations for that date
  const { data: reservations } = await supabase
    .from("area_reservations")
    .select("*, houses(house_number)")
    .eq("area_id", areaId)
    .eq("reservation_date", date)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true })

  return {
    slots: reservations || [],
    area: {
      opening_time: area.opening_time || "08:00",
      closing_time: area.closing_time || "22:00",
      max_hours: area.max_hours_per_reservation || 2,
      reception_minutes: area.reception_time_minutes || 30,
      delivery_minutes: area.delivery_time_minutes || 30,
    }
  }
}
