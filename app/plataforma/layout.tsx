import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { evaluarRegistroSinMfa, evaluarSuperAdmin } from "@/lib/auth/plataforma/guardia"
import { registrarAuditoria } from "@/lib/auth/plataforma/auditoria"
import { EncabezadoPlataforma } from "@/components/plataforma/encabezado-plataforma"
import { ConfigurarMfa } from "@/components/plataforma/configurar-mfa"
import { VerificarAcceso } from "@/components/plataforma/verificar-acceso"

export const metadata: Metadata = {
  title: "Plataforma - InteliCon",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function PlataformaLayout({ children }: { children: React.ReactNode }) {
  const { sesion, decision } = await evaluarSuperAdmin()
  if (!sesion.usuario) redirect("/auth/login?next=/plataforma")

  if (!decision.concedido) {
    const registro = await evaluarRegistroSinMfa()
    if (!registro.ok) {
      await registrarAuditoria({ actorId: sesion.usuario.id, accion: "acceso:plataforma", resultado: "denegado", motivo: decision.motivo })
      notFound()
    }
    const { data: factores } = await registro.supabase.auth.mfa.listFactors()
    const tieneFactor = Boolean(factores?.totp.some((f) => f.status === "verified"))
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4 py-10">
        {tieneFactor ? <VerificarAcceso /> : <ConfigurarMfa />}
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <EncabezadoPlataforma userId={sesion.usuario.id} email={sesion.usuario.email ?? ""} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">{children}</main>
    </div>
  )
}
