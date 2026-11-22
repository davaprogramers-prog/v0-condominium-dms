import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { requireGlobalSuperAdmin } from "@/lib/auth/plataforma/guardia"
import { GestionSuperAdmins } from "@/components/plataforma/gestion-super-admins"

export default async function PlataformaSuperAdmins() {
  const g = await requireGlobalSuperAdmin("super_admins.gestionar")
  if (!g.ok) notFound()

  const { data } = await createServiceClient()
    .from("platform_super_admins")
    .select("user_id, email, activo, creado_at, motivo_alta, desactivado_at, motivo_baja")
    .order("creado_at", { ascending: true })

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold text-foreground">Super administradores</h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Dar de alta o desactivar exige validar tu código hace menos de 10 minutos. Al desactivar se cierran sus sesiones y se eliminan sus factores.
        </p>
      </div>
      <GestionSuperAdmins registros={data ?? []} miId={g.usuario.id} />
    </>
  )
}
