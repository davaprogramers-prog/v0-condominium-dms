"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { altaSuperAdmin, desactivarSuperAdmin } from "@/app/plataforma/acciones"
import { useMfaReciente } from "./use-mfa-reciente"

type Registro = {
  user_id: string
  email: string
  activo: boolean
  creado_at: string
  motivo_alta: string | null
  desactivado_at: string | null
  motivo_baja: string | null
}

const fecha = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("es-CL", { year: "numeric", month: "short", day: "numeric" }) : "-"

export function GestionSuperAdmins({ registros, miId }: { registros: Registro[]; miId: string }) {
  const router = useRouter()
  const { ejecutar, dialogo } = useMfaReciente()
  const [email, setEmail] = useState("")
  const [motivoAlta, setMotivoAlta] = useState("")
  const [desactivar, setDesactivar] = useState<Registro | null>(null)
  const [motivoBaja, setMotivoBaja] = useState("")
  const [pendiente, setPendiente] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)
  const activos = registros.filter((r) => r.activo).length

  const darAlta = async (e: React.FormEvent) => {
    e.preventDefault()
    setPendiente(true)
    setMensaje(null)
    const r = await ejecutar(() => altaSuperAdmin(email, motivoAlta))
    setPendiente(false)
    if (!r.ok) return setMensaje({ tipo: "error", texto: r.error })
    setEmail("")
    setMotivoAlta("")
    setMensaje({ tipo: "ok", texto: "Alta registrada. La persona deberá configurar su verificación en dos pasos al entrar." })
    router.refresh()
  }

  const confirmarBaja = async () => {
    if (!desactivar) return
    setPendiente(true)
    setMensaje(null)
    const objetivo = desactivar
    const r = await ejecutar(() => desactivarSuperAdmin(objetivo.user_id, motivoBaja))
    setPendiente(false)
    if (!r.ok) return setMensaje({ tipo: "error", texto: r.error })
    setDesactivar(null)
    setMotivoBaja("")
    setMensaje({ tipo: "ok", texto: `${objetivo.email} quedó desactivado y sus sesiones cerradas.` })
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {mensaje && (
        <p
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={mensaje.tipo === "error" ? "rounded-md bg-destructive/10 p-3 text-sm text-destructive" : "rounded-md bg-muted p-3 text-sm text-foreground"}
        >
          {mensaje.texto}
        </p>
      )}

      <form onSubmit={darAlta} className="flex flex-col gap-4 rounded-lg border bg-card p-5 text-card-foreground">
        <h2 className="flex items-center gap-2 font-semibold">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          Dar de alta
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alta-email">Correo de una cuenta existente</Label>
            <Input id="alta-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="alta-motivo">Motivo</Label>
            <Input id="alta-motivo" value={motivoAlta} onChange={(e) => setMotivoAlta(e.target.value)} maxLength={300} required />
          </div>
        </div>
        <Button type="submit" className="self-start" disabled={pendiente || !email || motivoAlta.trim().length < 5}>
          Dar de alta
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted text-left">
              <th scope="col" className="px-4 py-3 font-semibold">Cuenta</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 font-semibold">Alta</th>
              <th scope="col" className="px-4 py-3 font-semibold">Motivo</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((r) => {
              const ultimo = r.activo && activos <= 1
              return (
                <tr key={r.user_id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {r.email}
                    {r.user_id === miId && <span className="ml-2 text-xs text-muted-foreground">(tú)</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={r.activo ? "secondary" : "outline"}>{r.activo ? "Activo" : `Desactivado ${fecha(r.desactivado_at)}`}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fecha(r.creado_at)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground" title={r.activo ? r.motivo_alta ?? "" : r.motivo_baja ?? ""}>
                    {r.activo ? r.motivo_alta : r.motivo_baja}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.activo && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={ultimo || pendiente}
                        title={ultimo ? "No se puede desactivar al último super administrador activo" : undefined}
                        onClick={() => {
                          setDesactivar(r)
                          setMotivoBaja("")
                        }}
                      >
                        <UserX className="h-4 w-4" aria-hidden="true" />
                        Desactivar
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <AlertDialog open={desactivar !== null} onOpenChange={(o) => !o && !pendiente && setDesactivar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar {desactivar?.email}</AlertDialogTitle>
            <AlertDialogDescription>
              Perderá el acceso global de inmediato: se cierran todas sus sesiones y se elimina su factor de verificación.
              {desactivar?.user_id === miId && " Estás desactivando tu propia cuenta."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="motivo-baja">Motivo</Label>
            <Textarea id="motivo-baja" value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} maxLength={300} rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void confirmarBaja()
              }}
              disabled={pendiente || motivoBaja.trim().length < 5}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {pendiente ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {dialogo}
    </div>
  )
}
