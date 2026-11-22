import Link from "next/link"
import { notFound } from "next/navigation"
import { createServiceClient } from "@/lib/supabase/server"
import { requireGlobalSuperAdmin } from "@/lib/auth/plataforma/guardia"
import { Badge } from "@/components/ui/badge"

const RESULTADOS = ["concedido", "denegado", "error"] as const
const POR_PAGINA = 100

export default async function PlataformaAuditoria({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string; accion?: string; pagina?: string }>
}) {
  const g = await requireGlobalSuperAdmin("auditoria.ver")
  if (!g.ok) notFound()

  const sp = await searchParams
  const resultado = RESULTADOS.find((r) => r === sp.resultado)
  const accion = typeof sp.accion === "string" ? sp.accion.replace(/[^a-z_.:]/gi, "").slice(0, 60) : ""
  const pagina = Math.max(1, Math.min(1000, Number.parseInt(sp.pagina ?? "1", 10) || 1))

  const service = createServiceClient()
  let q = service
    .from("platform_audit_log")
    .select("id, created_at, actor_id, accion, resultado, condo_id, objetivo_user_id, motivo, ip")
    .order("created_at", { ascending: false })
    .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  if (resultado) q = q.eq("resultado", resultado)
  if (accion) q = q.ilike("accion", `${accion}%`)
  const { data: filas } = await q

  const ids = [...new Set((filas ?? []).flatMap((f) => [f.actor_id, f.objetivo_user_id]).filter(Boolean))] as string[]
  const { data: perfiles } = ids.length
    ? await service.from("profiles").select("id, email").in("id", ids.slice(0, 150))
    : { data: [] as { id: string; email: string }[] }
  const correo = new Map((perfiles ?? []).map((p) => [p.id, p.email]))
  const hayMas = (filas?.length ?? 0) > POR_PAGINA
  const visibles = (filas ?? []).slice(0, POR_PAGINA)

  const enlace = (cambios: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const base = { resultado, accion: accion || undefined, pagina: undefined as string | undefined, ...cambios }
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v)
    const s = p.toString()
    return s ? `/plataforma/auditoria?${s}` : "/plataforma/auditoria"
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-balance text-2xl font-semibold text-foreground">Auditoría</h1>
        <p className="text-sm text-muted-foreground">Registro de solo lectura de accesos y operaciones globales.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3" action="/plataforma/auditoria">
        <div className="flex flex-col gap-1">
          <label htmlFor="f-accion" className="text-sm font-medium text-foreground">Acción</label>
          <input id="f-accion" name="accion" defaultValue={accion} placeholder="p. ej. mfa." className="h-9 rounded-md border bg-background px-3 text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="f-resultado" className="text-sm font-medium text-foreground">Resultado</label>
          <select id="f-resultado" name="resultado" defaultValue={resultado ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="">Todos</option>
            {RESULTADOS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filtrar</button>
        {(resultado || accion) && (
          <Link href="/plataforma/auditoria" className="h-9 px-2 text-sm leading-9 text-primary underline-offset-4 hover:underline">Limpiar</Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left">
              <th scope="col" className="px-3 py-2 font-semibold">Fecha</th>
              <th scope="col" className="px-3 py-2 font-semibold">Actor</th>
              <th scope="col" className="px-3 py-2 font-semibold">Acción</th>
              <th scope="col" className="px-3 py-2 font-semibold">Resultado</th>
              <th scope="col" className="px-3 py-2 font-semibold">Objetivo</th>
              <th scope="col" className="px-3 py-2 font-semibold">Motivo</th>
              <th scope="col" className="px-3 py-2 font-semibold">IP</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.id} className="border-b last:border-0 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                  {new Date(f.created_at).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "medium" })}
                </td>
                <td className="px-3 py-2 text-foreground">{f.actor_id ? correo.get(f.actor_id) ?? f.actor_id.slice(0, 8) : "-"}</td>
                <td className="px-3 py-2 font-mono text-xs text-foreground">{f.accion}</td>
                <td className="px-3 py-2">
                  <Badge variant={f.resultado === "concedido" ? "secondary" : f.resultado === "denegado" ? "outline" : "destructive"}>{f.resultado}</Badge>
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {f.objetivo_user_id ? correo.get(f.objetivo_user_id) ?? f.objetivo_user_id.slice(0, 8) : f.condo_id ? `Condominio ${f.condo_id.slice(0, 8)}` : "-"}
                </td>
                <td className="max-w-xs px-3 py-2 text-muted-foreground">{f.motivo ?? "-"}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{f.ip ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibles.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Sin registros para este filtro.</p>}
      </div>

      <nav aria-label="Paginación" className="flex justify-between text-sm">
        {pagina > 1 ? <Link href={enlace({ pagina: String(pagina - 1) })} className="text-primary underline-offset-4 hover:underline">Anteriores</Link> : <span />}
        {hayMas && <Link href={enlace({ pagina: String(pagina + 1) })} className="text-primary underline-offset-4 hover:underline">Siguientes</Link>}
      </nav>
    </>
  )
}
