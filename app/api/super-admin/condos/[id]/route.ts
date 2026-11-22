import { NextRequest, NextResponse } from "next/server"
import { requireGlobalSuperAdmin, respuestaDenegada } from "@/lib/auth/plataforma/guardia"
import { registrarAuditoria } from "@/lib/auth/plataforma/auditoria"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) return NextResponse.json({ error: "Condominio inválido" }, { status: 400 })

  const guardia = await requireGlobalSuperAdmin("condominios.gestionar", {
    accionMfaReciente: "condominio.eliminar",
    condoId: id,
  })
  if (!guardia.ok) return respuestaDenegada(guardia)

  let motivo = ""
  try {
    const body = await request.json()
    motivo = typeof body?.motivo === "string" ? body.motivo.trim() : ""
  } catch {
    motivo = ""
  }
  if (motivo.length < 5) {
    return NextResponse.json({ error: "Indica el motivo de la eliminación (mínimo 5 caracteres)." }, { status: 400 })
  }

  try {
    const { data, error } = await guardia.supabase.from("condominiums").delete().eq("id", id).select("id")
    if (error) throw error
    if (!data || data.length === 0) return NextResponse.json({ error: "Condominio no encontrado" }, { status: 404 })
    await registrarAuditoria({ actorId: guardia.usuario.id, accion: "condominio.eliminar", resultado: "concedido", condoId: id, motivo })
    return NextResponse.json({ success: true })
  } catch (error) {
    await registrarAuditoria({ actorId: guardia.usuario.id, accion: "condominio.eliminar", resultado: "error", condoId: id, motivo })
    console.error("[plataforma] Error al eliminar condominio:", (error as Error).message)
    return NextResponse.json({ error: "Error al eliminar condominio" }, { status: 500 })
  }
}
