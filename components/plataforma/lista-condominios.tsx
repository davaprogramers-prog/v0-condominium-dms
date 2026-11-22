"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Building2, Check, LogIn, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { entrarACondominio } from "@/app/plataforma/acciones"
import { useMfaReciente } from "./use-mfa-reciente"

type Condo = { id: string; name: string; created_at: string; logo_url?: string | null }

export function ListaCondominios({ condos, condoActualId }: { condos: Condo[]; condoActualId?: string | null }) {
  const router = useRouter()
  const { ejecutar, dialogo } = useMfaReciente()
  const [entrando, setEntrando] = useState<string | null>(null)
  const [eliminar, setEliminar] = useState<Condo | null>(null)
  const [motivo, setMotivo] = useState("")
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState("")

  const entrar = async (id: string) => {
    setError("")
    setEntrando(id)
    const r = await entrarACondominio(id)
    if (!r.ok) {
      setError(r.error)
      setEntrando(null)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  const confirmarEliminacion = async () => {
    if (!eliminar) return
    setEliminando(true)
    setError("")
    const objetivo = eliminar
    const r = await ejecutar(async () => {
      const res = await fetch(`/api/super-admin/condos/${objetivo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo }),
      })
      const body = await res.json().catch(() => ({}))
      return res.ok ? { ok: true } : { ok: false, error: body.error as string, codigo: body.codigo as string }
    })
    setEliminando(false)
    if (!r.ok) {
      setError(r.error || "No fue posible eliminar el condominio.")
      return
    }
    setEliminar(null)
    setMotivo("")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Nombre</th>
              <th scope="col" className="px-4 py-3 font-semibold">Creado</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {condos.map((c) => {
              const activo = c.id === condoActualId
              return (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <span className="font-medium text-foreground">{c.name}</span>
                      {activo && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Check className="h-3 w-3" aria-hidden="true" />
                          Actual
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("es-CL", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => entrar(c.id)} disabled={entrando !== null}>
                        {entrando === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <LogIn className="h-4 w-4" aria-hidden="true" />
                        )}
                        Operar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEliminar(c)
                          setMotivo("")
                        }}
                        aria-label={`Eliminar ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {condos.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No hay condominios registrados.</p>}
      </div>

      <AlertDialog open={eliminar !== null} onOpenChange={(o) => !o && !eliminando && setEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {eliminar?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el condominio y sus datos asociados. Esta acción no se puede deshacer y queda registrada en la auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo-eliminar">Motivo</Label>
            <Textarea id="motivo-eliminar" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmarEliminacion()
              }}
              disabled={eliminando || motivo.trim().length < 5}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {dialogo}
    </div>
  )
}
