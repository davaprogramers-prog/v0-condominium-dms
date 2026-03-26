import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Verify the current user is super_admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (currentProfile?.role !== "super_admin") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

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
        role: "admin",
      }
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

    return NextResponse.json({ success: true, userId: newUser.user.id })
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
