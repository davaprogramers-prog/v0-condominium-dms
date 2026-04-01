import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { LoginForm } from "./login-form"

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
      <div className="flex flex-col items-center justify-center gap-3">
        <img 
          src="/intelicon-logo.png" 
          alt="InteliCon Logo" 
          className="h-16 w-auto object-contain"
        />
        <p className="text-sm text-muted-foreground">Inicia sesión en tu cuenta</p>
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
