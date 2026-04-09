import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, role, condoId, houseId, isOwner } = body

    // Get the service role client for admin operations
    const supabase = await createServerClient()
    
    // Verify the current user making the request is admin or super_admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUser.id)
      .single()

    if (!currentProfile || !["admin", "super_admin"].includes(currentProfile.role)) {
      return NextResponse.json({ error: "No tienes permisos para crear usuarios" }, { status: 403 })
    }

    // Create auth user
    const { data: { user: newUser }, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError || !newUser) {
      return NextResponse.json({ 
        error: authError?.message || "Error al crear usuario" 
      }, { status: 400 })
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: newUser.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        condo_id: condoId,
      })

    if (profileError) {
      // Try to delete the auth user since profile creation failed
      await supabase.auth.admin.deleteUser(newUser.id)
      return NextResponse.json({ error: "Error al crear perfil" }, { status: 400 })
    }

    // Assign house if needed
    // If role is propietario OR if isOwner flag is set
    const shouldAssignHouse = (role === "propietario" || isOwner) && houseId
    
    if (shouldAssignHouse) {
      const { error: houseError } = await supabase
        .from("house_owners")
        .insert({
          house_id: houseId,
          user_id: newUser.id,
        })

      if (houseError) {
        console.error("Error assigning house:", houseError)
        // Continue - user is created, just not assigned to house
      }
    }

    return NextResponse.json({ 
      success: true, 
      userId: newUser.id 
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ 
      error: "Error inesperado al crear el usuario" 
    }, { status: 500 })
  }
}
