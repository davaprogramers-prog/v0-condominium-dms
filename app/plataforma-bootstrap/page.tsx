import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { FormularioBootstrap } from "@/components/plataforma/formulario-bootstrap"

export const metadata: Metadata = { title: "Alta inicial - Plataforma", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

export default async function PaginaBootstrap() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect("/auth/login?next=/plataforma-bootstrap")

  const service = createServiceClient()
  const [{ count: usado }, { count: admins }] = await Promise.all([
    service.from("platform_bootstrap").select("id", { count: "exact", head: true }),
    service.from("platform_super_admins").select("user_id", { count: "exact", head: true }),
  ])
  // Una vez usado, la ruta deja de existir.
  if ((usado ?? 1) > 0 || (admins ?? 1) > 0 || !process.env.SUPER_ADMIN_BOOTSTRAP_TOKEN) notFound()

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <FormularioBootstrap email={data.user.email ?? ""} />
    </main>
  )
}
