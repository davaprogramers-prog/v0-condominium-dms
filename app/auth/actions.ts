"use server"

import { createClient, createServiceClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Resend } from "resend"
import { consumirIntento, mensajeEspera } from "@/lib/auth/plataforma/limite"
import { cerrarSesiones } from "@/lib/auth/plataforma/sesiones"
import {
  MINUTOS_VIGENCIA_CODIGO,
  correoVerificado,
  generarCodigoCorreo,
  hashCodigoCorreo,
  htmlCorreoCodigo,
} from "@/lib/auth/verificacion-correo"

export async function login(formData: FormData) {
  const supabase = await createClient()
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }
  const { error, data: authData } = await supabase.auth.signInWithPassword(data)
  if (error) {
    return redirect("/auth/login?error=" + encodeURIComponent(error.message))
  }

  // Ensure user profile is set up correctly
  if (authData?.user) {
    const result = await ensureUserProfile(authData.user.id, authData.user.email || "")
    console.log("[v0] Login ensureUserProfile result:", result)
  }

  return redirect("/dashboard")
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("first_name") as string
  const lastName = formData.get("last_name") as string
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return redirect("/auth/registro?error=" + encodeURIComponent(error.message))
  }
  return redirect("/auth/registro-exitoso")
}

type RegisterResult = { success: true } | { success: false; error: string }

export type PropiedadRegistro = { id: string; house_number: number; condo_id: string; condoName: string }

/**
 * Paso 1 del registro. Antes el navegador leía `houses` como anónimo (la política dejaba leer todas las casas
 * con sus correos). Ahora se consulta en el servidor, con límite de intentos, y solo vuelve lo necesario.
 */
export async function buscarPropiedadesPorCorreo(
  correo: string,
): Promise<{ ok: true; propiedades: PropiedadRegistro[] } | { ok: false; error: string }> {
  const email = String(correo || "").trim().toLowerCase()
  if (!email || email.length > 254 || !email.includes("@")) return { ok: false, error: "Correo no válido" }

  const espera = await consumirIntento("recuperacion", `registro-busqueda:${email}`)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const { data, error } = await createServiceClient()
    .from("houses")
    .select("id, house_number, condo_id, condominiums(name)")
    .ilike("owner_email", email)
  if (error) return { ok: false, error: "No se pudo validar el correo" }

  return {
    ok: true,
    propiedades: (data ?? []).map((h: any) => ({
      id: h.id,
      house_number: h.house_number,
      condo_id: h.condo_id,
      condoName: h.condominiums?.name || "Condominio",
    })),
  }
}

const YA_REGISTRADO = "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña."

function normalizarCorreo(valor: string): string {
  return String(valor || "").trim().toLowerCase()
}

async function casaDelCorreo(email: string, houseId: string) {
  const { data, error } = await createServiceClient()
    .from("houses")
    .select("id, condo_id")
    .eq("id", houseId)
    .ilike("owner_email", email)
    .maybeSingle()
  return error ? null : data
}

/** Cuenta Auth existente con ese correo (vía profiles, que handle_new_user crea para toda cuenta). */
async function cuentaExistente(email: string) {
  const service = createServiceClient()
  const { data: perfil } = await service.from("profiles").select("id").ilike("email", email).maybeSingle()
  if (!perfil) return null
  const { data } = await service.auth.admin.getUserById(perfil.id)
  return data.user ?? null
}

/**
 * Paso previo a crear la cuenta: envía un código de 6 dígitos al correo de la casa.
 * La confirmación de correo de Supabase está desactivada, así que esta es la única prueba de que
 * quien se registra controla ese correo.
 */
export async function solicitarCodigoRegistro(
  correo: string,
  houseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = normalizarCorreo(correo)
  if (!email || email.length > 254 || !email.includes("@") || email.endsWith("@demo.invalid")) {
    return { ok: false, error: "Correo no válido" }
  }

  const espera = await consumirIntento("recuperacion", `registro-codigo:${email}`)
  if (espera > 0) return { ok: false, error: mensajeEspera(espera) }

  const house = await casaDelCorreo(email, houseId)
  if (!house) return { ok: false, error: "Casa no válida" }

  const existente = await cuentaExistente(email)
  if (existente && correoVerificado(existente)) return { ok: false, error: YA_REGISTRADO }

  const apiKey = process.env.RESENDCONDO_API_KEY
  if (!apiKey) return { ok: false, error: "El servicio de correo no está configurado. Contacta al administrador." }

  const codigo = generarCodigoCorreo()
  const { error } = await createServiceClient().rpc("fn_registro_emitir_codigo", {
    p_email: email,
    p_house: house.id,
    p_hash: hashCodigoCorreo(email, codigo),
    p_minutos: MINUTOS_VIGENCIA_CODIGO,
  })
  if (error) {
    console.error("[registro] No se pudo emitir el código:", error.message)
    return { ok: false, error: "No se pudo generar el código. Intenta de nuevo." }
  }

  const envio = await new Resend(apiKey).emails.send({
    from: "noreply@administracioncondominio.app",
    to: email,
    subject: "Tu código para crear la cuenta - InteliCon",
    html: htmlCorreoCodigo(codigo),
  })
  if (envio.error) {
    console.error("[registro] No se pudo enviar el código:", envio.error.message)
    return { ok: false, error: "No se pudo enviar el correo. Intenta de nuevo en unos minutos." }
  }
  return { ok: true }
}

const MENSAJES_CODIGO: Record<string, string> = {
  sin_codigo: "Primero solicita un código.",
  vencido: "El código venció. Solicita uno nuevo.",
  bloqueado: "Demasiados intentos con este código. Solicita uno nuevo.",
  invalido: "El código no es correcto.",
}

export async function registerOwner(
  correo: string,
  password: string,
  firstName: string,
  lastName: string,
  houseId: string,
  codigo: string,
): Promise<RegisterResult> {
  const serviceClient = createServiceClient()
  const email = normalizarCorreo(correo)
  const nombre = String(firstName || "").trim().slice(0, 80)
  const apellido = String(lastName || "").trim().slice(0, 80)
  const codigoLimpio = String(codigo || "").replace(/\s/g, "")

  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return { success: false, error: "La contraseña debe tener entre 8 y 72 caracteres" }
  }
  if (!/^\d{6}$/.test(codigoLimpio)) return { success: false, error: "Ingresa los 6 dígitos del código" }

  const espera = await consumirIntento("recuperacion", `registro:${email}`)
  if (espera > 0) return { success: false, error: mensajeEspera(espera) }

  // La casa debe estar registrada a ESTE correo (antes bastaba cualquier id de casa).
  const house = await casaDelCorreo(email, houseId)
  if (!house) return { success: false, error: "Casa no válida" }

  const { data: verificacion, error: errorVerificacion } = await serviceClient.rpc("fn_registro_verificar_codigo", {
    p_email: email,
    p_hash: hashCodigoCorreo(email, codigoLimpio),
  })
  const resultado = Array.isArray(verificacion) ? verificacion[0] : verificacion
  if (errorVerificacion || !resultado) return { success: false, error: "No se pudo validar el código. Intenta de nuevo." }
  if (resultado.estado !== "ok") return { success: false, error: MENSAJES_CODIGO[resultado.estado] ?? MENSAJES_CODIGO.invalido }
  if (resultado.house_id !== house.id) return { success: false, error: "El código no corresponde a esta propiedad. Solicita uno nuevo." }

  const { data: creado, error: errorCreacion } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: nombre, last_name: apellido },
    app_metadata: { role: "owner", correo_verificado: true },
  })

  let userId = creado?.user?.id ?? null
  let cuentaNueva = Boolean(userId)

  if (errorCreacion) {
    const existente = await cuentaExistente(email)
    if (!existente) {
      console.error("[registro] No se pudo crear la cuenta:", errorCreacion.message)
      return { success: false, error: "No se pudo crear la cuenta. Intenta de nuevo." }
    }
    if (correoVerificado(existente)) return { success: false, error: YA_REGISTRADO }

    // Cuenta creada sin probar el correo (p. ej. con signUp directo). Quien tiene el código controla el
    // correo: toma la cuenta con su clave y se cierran las sesiones de quien la hubiera creado.
    const { error: errorActualizacion } = await serviceClient.auth.admin.updateUserById(existente.id, {
      password,
      email_confirm: true,
      app_metadata: { ...existente.app_metadata, correo_verificado: true },
    })
    if (errorActualizacion) {
      console.error("[registro] No se pudo actualizar la cuenta:", errorActualizacion.message)
      return { success: false, error: "No se pudo crear la cuenta. Intenta de nuevo." }
    }
    try {
      await cerrarSesiones(existente.id)
    } catch (e) {
      console.error("[registro] No se pudieron cerrar sesiones previas:", (e as Error).message)
    }
    userId = existente.id
    cuentaNueva = false
  }

  if (!userId) return { success: false, error: "No se pudo crear la cuenta" }

  if (cuentaNueva) {
    const { error: profileError } = await serviceClient.from("profiles").upsert({
      id: userId,
      email,
      first_name: nombre,
      last_name: apellido,
      house_id: house.id,
      condo_id: house.condo_id,
      role: "owner",
    })
    if (profileError) {
      console.error("[registro] Error al crear el perfil:", profileError.message)
      return { success: false, error: "La cuenta se creó, pero no se pudo preparar el perfil. Contacta al administrador." }
    }
  } else {
    // Perfil existente: solo se asigna la casa si aún no pertenece a ningún condominio; nunca se cambia el rol.
    const { data: perfil } = await serviceClient.from("profiles").select("condo_id, role").eq("id", userId).maybeSingle()
    if (!perfil?.condo_id) {
      await serviceClient
        .from("profiles")
        .update({
          house_id: house.id,
          condo_id: house.condo_id,
          role: perfil?.role || "owner",
          ...(nombre ? { first_name: nombre } : {}),
          ...(apellido ? { last_name: apellido } : {}),
        })
        .eq("id", userId)
    }
  }

  return { success: true }
}

export async function ensureUserProfile(userId: string, email: string) {
  try {
    const sesion = await createClient()
    const { data: { user: usuarioSesion } } = await sesion.auth.getUser()
    if (!usuarioSesion || usuarioSesion.id !== userId) {
      return { success: false, error: "No autorizado" }
    }
    email = usuarioSesion.email ?? email

    // Use service client to bypass RLS for profile creation
    const supabase = createServiceClient()

    console.log("[v0] ensureUserProfile START - userId:", userId, "email:", email)

    // Buscar en public.houses por owner_email (para propietarios). Solo si la cuenta probó que el correo
    // es suyo: sin confirmación de correo en Supabase, cualquiera puede crear una cuenta con un correo ajeno.
    const { data: houses, error: housesErr } = correoVerificado(usuarioSesion)
      ? await supabase.from("houses").select("id, condo_id, owner_name").eq("owner_email", email)
      : { data: [] as { id: string; condo_id: string; owner_name: string | null }[], error: null }

    console.log("[v0] Houses query - found:", houses?.length || 0, "houses:", houses?.map(h => ({ id: h.id, condo_id: h.condo_id })), "error:", housesErr?.message)
    console.log("[v0] DEBUG: hasMultipleProperties should be:", (houses?.length || 0) > 1)

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (existingProfile) {
      console.log("[v0] Profile already exists for user:", userId, "role:", existingProfile.role, "current condo_id:", existingProfile.condo_id)
      console.log("[v0] RETURNING with hasMultipleProperties:", (houses?.length || 0) > 1)
      // Return existing profile info BUT include hasMultipleProperties based on actual houses count
      return { success: true, role: existingProfile.role, hasMultipleProperties: (houses?.length || 0) > 1 }
    }

    if (houses && houses.length > 0) {
      // User is a property owner - associate with first house and condo
      const firstHouse = houses[0]
      console.log("[v0] First house data:", { id: firstHouse.id, condo_id: firstHouse.condo_id, owner_name: firstHouse.owner_name })

      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email,
          first_name: firstHouse.owner_name || email.split("@")[0],
          last_name: "",
          house_id: firstHouse.id,
          condo_id: firstHouse.condo_id,
          role: "propietario",
        })

      if (insertError && insertError.code !== "23505") {
        console.log("[v0] INSERT error:", insertError.message)
        return { success: false, error: insertError.message }
      }

      console.log("[v0] NEW PROFILE CREATED - hasMultipleProperties:", houses.length > 1)
      return { success: true, role: "propietario", hasMultipleProperties: houses.length > 1 }
    } else {
      // No house found - user might be conserje, admin, etc.
      // Get the condo_id from auth user metadata if available
      const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
      // Solo app_metadata (controlado por el servidor); user_metadata lo edita el propio usuario.
      const condoId = authUser?.app_metadata?.condo_id
      const rolApp = authUser?.app_metadata?.role
      const role = ["admin", "conserje", "owner", "propietario"].includes(rolApp) ? rolApp : "propietario"

      if (condoId) {
        // User has condo_id but no house - likely conserje, admin, etc.
        console.log("[v0] Creating profile for non-owner user with condo_id:", condoId, "role:", role)
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email,
            first_name: email.split("@")[0],
            last_name: "",
            condo_id: condoId,
            role: role,
          })

        if (insertError && insertError.code !== "23505") {
          console.log("[v0] INSERT error for non-owner:", insertError.message)
          return { success: false, error: insertError.message }
        }

        return { success: true, role: role }
      } else {
        // No condo_id and no house - can't assign
        console.log("[v0] No house and no condo_id - cannot auto-assign")
        return { success: false, message: "Awaiting admin assignment" }
      }
    }
  } catch (err) {
    console.error("[v0] ensureUserProfile ERROR:", err)
    return { success: false, error: String(err) }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
