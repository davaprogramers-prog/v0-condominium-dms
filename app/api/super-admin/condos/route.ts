import { NextRequest, NextResponse } from "next/server"
import { requireGlobalSuperAdmin, respuestaDenegada } from "@/lib/auth/plataforma/guardia"
import { registrarAuditoria } from "@/lib/auth/plataforma/auditoria"

export async function GET() {
  const guardia = await requireGlobalSuperAdmin("condominios.gestionar")
  if (!guardia.ok) return respuestaDenegada(guardia)

  try {
    const { data: condos, error } = await guardia.supabase
      .from("condominiums")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(condos || [])
  } catch (error) {
    console.error("[plataforma] Error al cargar condominios:", (error as Error).message)
    return NextResponse.json({ error: "Error al cargar condominios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guardia = await requireGlobalSuperAdmin("condominios.gestionar")
  if (!guardia.ok) return respuestaDenegada(guardia)

  try {
    const body = await request.json()
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 150) : ""
    const country = typeof body?.country === "string" ? body.country.trim().slice(0, 80) : null
    const city = typeof body?.city === "string" ? body.city.trim().slice(0, 80) : null

    if (!name) {
      return NextResponse.json({ error: "El nombre del condominio es requerido" }, { status: 400 })
    }

    const { data: condo, error } = await guardia.supabase
      .from("condominiums")
      .insert([{ name, country, city, created_by: guardia.usuario.id }])
      .select()
      .single()

    if (error) throw error
    await registrarAuditoria({ actorId: guardia.usuario.id, accion: "condominio.crear", resultado: "concedido", condoId: condo.id })
    return NextResponse.json(condo)
  } catch (error) {
    console.error("[plataforma] Error al crear condominio:", (error as Error).message)
    return NextResponse.json({ error: "Error al crear condominio" }, { status: 500 })
  }
}
