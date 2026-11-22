import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { requireGlobalSuperAdmin, respuestaDenegada } from "@/lib/auth/plataforma/guardia"
import { registrarAuditoria } from "@/lib/auth/plataforma/auditoria"

export async function POST(request: Request) {
  try {
    const guardia = await requireGlobalSuperAdmin("condominios.gestionar")
    if (!guardia.ok) return respuestaDenegada(guardia)

    const body = await request.json()
    const { email, password, firstName, lastName, condoId } = body

    if (!email || !password || !firstName) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Use service role client to bypass rate limits and email verification
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create user with admin API (no email verification needed)
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
      app_metadata: { role: "admin" },
    })

    if (authError) {
      console.error("[v0] Error creating auth user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 400 })
    }

    // Update profile with condo_id and role using service role (bypasses RLS)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: "admin",
        condo_id: condoId || null,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error("[v0] Profile upsert error:", profileError)
      // If profile fails, still return success since auth user was created
      // The profile will be created on first login via trigger
      return NextResponse.json({ 
        success: true, 
        userId: newUser.user.id,
        warning: "Usuario creado pero perfil pendiente"
      })
    }

    await registrarAuditoria({
      actorId: guardia.usuario.id,
      accion: "administrador.crear",
      resultado: "concedido",
      condoId: condoId || null,
      objetivoUserId: newUser.user.id,
    })
    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
