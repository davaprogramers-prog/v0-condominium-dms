import { notFound } from "next/navigation"
import { requireGlobalSuperAdmin } from "@/lib/auth/plataforma/guardia"
import { ListaCondominios } from "@/components/plataforma/lista-condominios"
import { CreateCondoDialog } from "@/components/plataforma/crear-condominio-dialog"

export default async function PlataformaCondominios() {
  const g = await requireGlobalSuperAdmin("condominios.gestionar")
  if (!g.ok) notFound()

  const [{ data: condos }, { data: perfil }] = await Promise.all([
    g.supabase.from("condominiums").select("id, name, created_at, logo_url").order("created_at", { ascending: false }),
    g.supabase.from("profiles").select("condo_id").eq("id", g.usuario.id).maybeSingle(),
  ])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-2xl font-semibold text-foreground">Condominios</h1>
          <p className="text-sm text-muted-foreground">
            {condos?.length ?? 0} registrados. Operar dentro de uno queda registrado en la auditoría.
          </p>
        </div>
        <CreateCondoDialog />
      </div>
      <ListaCondominios condos={condos ?? []} condoActualId={perfil?.condo_id ?? null} />
    </>
  )
}
