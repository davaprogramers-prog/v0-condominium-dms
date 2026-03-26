import Link from "next/link"
import { Building2 } from "lucide-react"
import { RegistroForm } from "./registro-form"

export default function RegistroPage() {
  return (
    <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-lg">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
          <Building2 className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">CondoAdmin</h1>
          <p className="text-sm text-muted-foreground">Crea tu cuenta</p>
        </div>
      </div>
      
      <RegistroForm />

      <div className="text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  )
}
