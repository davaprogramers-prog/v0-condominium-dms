import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

/**
 * Solo para Server Components (layout/páginas): una única verificación de sesión y lectura de perfil
 * por petición, compartida entre el layout y la página. No usar en acciones que inician o cierran sesión.
 */
export const usuarioActual = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { user: error ? null : data.user }
})

export const perfilActual = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("role, condo_id, house_id, first_name, last_name, avatar_url")
    .eq("id", userId)
    .maybeSingle()
  return error ? null : data
})
