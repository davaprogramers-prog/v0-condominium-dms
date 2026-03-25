import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LoginForm } from "./login-form"
import { Building2 } from "lucide-react"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role === "super_admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">CondoAdmin</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión en tu cuenta</p>
        </div>
      </div>
      
      <LoginForm />

      <div className="text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/registro" className="font-semibold text-primary hover:underline">
          Registrarse aquí
        </Link>
      </div>
    </div>
  )
}
