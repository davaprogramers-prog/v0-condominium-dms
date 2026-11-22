"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const SECCIONES = [
  { href: "/plataforma", etiqueta: "Condominios" },
  { href: "/plataforma/super-admins", etiqueta: "Super administradores" },
  { href: "/plataforma/seguridad", etiqueta: "Seguridad" },
  { href: "/plataforma/auditoria", etiqueta: "Auditoría" },
]

export function EncabezadoPlataforma({ userId, email }: { userId: string; email: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [otraCuenta, setOtraCuenta] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const comprobar = async () => {
      const { data } = await supabase.auth.getSession()
      setOtraCuenta(!data.session || data.session.user.id !== userId)
    }
    void comprobar()
    const { data: sub } = supabase.auth.onAuthStateChange(() => void comprobar())
    window.addEventListener("focus", comprobar)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener("focus", comprobar)
    }
  }, [userId])

  return (
    <header className="border-b border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" aria-hidden="true" />
            <span className="font-semibold">Plataforma</span>
            <span className="rounded border border-sidebar-border px-1.5 py-0.5 text-xs">Acceso global</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="truncate" title="Cuenta verificada en el servidor">
              {email}
            </span>
            <Link href="/dashboard" className="flex items-center gap-1 underline-offset-4 hover:underline">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Panel del condominio
            </Link>
          </div>
        </div>
        <nav aria-label="Secciones de plataforma">
          <ul className="flex flex-wrap gap-1">
            {SECCIONES.map((s) => {
              const activa = s.href === "/plataforma" ? pathname === s.href : pathname.startsWith(s.href)
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-3 py-1.5 text-sm",
                      activa ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60",
                    )}
                  >
                    {s.etiqueta}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
      {otraCuenta && (
        <div role="alert" className="bg-destructive text-destructive-foreground">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            La sesión de esta pestaña cambió de cuenta. Las acciones se harán con la cuenta activa.
            <button type="button" onClick={() => router.refresh()} className="font-medium underline">
              Recargar
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
