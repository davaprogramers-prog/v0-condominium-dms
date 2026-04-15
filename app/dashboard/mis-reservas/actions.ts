"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  const { data: existingReservations } = await serviceClient
    .from("area_reservations")
    .select("*")
    .eq("area_id", data.area_id)
    .eq("reservation_date", data.reservation_date)
    .eq("status", "confirmed")

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
        const suggestEndBefore = existingStartMin - receptionMin
        const suggestStartBefore = Math.max(openMin, suggestEndBefore - (maxHours * 60))
        
        // Suggest time after the existing reservation
        const suggestStartAfter = existingEndMin + deliveryMin
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

  // Verify user has permission for this house
  const { data: profile } = await supabase
    .from("profiles")
    .select("house_id, role")
    .eq("id", user.id)
    .single()
  
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin" || profile?.role === "conserje"
  if (!isAdmin && profile?.house_id !== data.house_id) {
    throw new Error("No tienes permisos para crear reservas para esta propiedad.")
  }

  // Create reservation using service client to bypass RLS (we already validated permissions above)
  const { error } = await serviceClient.from("area_reservations").insert({
    area_id: data.area_id,
    house_id: data.house_id,
    condo_id: data.condo_id,
    reservation_date: data.reservation_date,
    start_time: data.start_time,
    end_time: data.end_time,
    notes: data.notes || null,
    created_by: user.id,
    status: "confirmed",
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get the reservation
  const { data: reservation, error: reservationError } = await supabase
    .from("area_reservations")
    .select("*, common_areas(*)")
    .eq("id", data.reservation_id)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")

  const area = reservation.common_areas

  // Check modification time limit for non-admin users
  if (!isAdminOrConcierge) {
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
  const serviceClient = createServiceClient()
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

  // Update reservation
  const { error } = await supabase
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
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  // Get the reservation
  const { data: reservation, error: reservationError } = await supabase
    .from("area_reservations")
    .select("*, common_areas(*)")
    .eq("id", reservationId)
    .single()

  if (reservationError || !reservation) throw new Error("Reserva no encontrada")

  const area = reservation.common_areas

  // Check modification time limit for non-admin users
  if (!isAdminOrConcierge) {
    if (!canModifyReservation(
      reservation.reservation_date,
      reservation.start_time,
      area.min_hours_to_modify || 12
    )) {
      throw new Error(`No puedes cancelar la reserva con menos de ${area.min_hours_to_modify || 12} horas de anticipación`)
    }
  }

  // Cancel reservation (soft delete by changing status)
  const { error } = await supabase
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

  if (!profile || !["admin", "super_admin", "conserje"].includes(profile.role)) {
    throw new Error("No tienes permisos para realizar esta acción")
  }

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
