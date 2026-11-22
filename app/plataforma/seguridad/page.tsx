import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { requireGlobalSuperAdmin } from "@/lib/auth/plataforma/guardia"
import { ultimaVerificacionTotp } from "@/lib/auth/plataforma/decision"
import { PanelSeguridad } from "@/components/plataforma/panel-seguridad"

export default async function PlataformaSeguridad() {
  const g = await requireGlobalSuperAdmin("seguridad.gestionar")
  if (!g.ok) notFound()

  const [{ data: factores }, { count }] = await Promise.all([
    g.supabase.auth.mfa.listFactors(),
    createServiceClient()
      .from("platform_mfa_recovery_codes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", g.usuario.id)
      .is("usado_at", null),
  ])
  const factor = factores?.totp.find((f) => f.status === "verified")
  const ultima = ultimaVerificacionTotp(g.amr)

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold text-foreground">Seguridad de tu cuenta</h1>
        <p className="text-sm text-muted-foreground">Verificación en dos pasos, códigos de recuperación y sesiones.</p>
      </div>
      <PanelSeguridad
        factor={factor ? { nombre: factor.friendly_name ?? "Aplicación de autenticación", creado: factor.created_at } : null}
        codigosDisponibles={count ?? 0}
        ultimaVerificacion={ultima ? new Date(ultima * 1000).toISOString() : null}
      />
    </>
  )
}
