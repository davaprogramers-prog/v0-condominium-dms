"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PasoTotp } from "@/components/auth/paso-totp"

export function VerificarAcceso() {
  const router = useRouter()
  return (
    <div className="mx-auto w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
      <PasoTotp
        onVerificado={() => router.refresh()}
        onCancelar={async () => {
          await createClient().auth.signOut({ scope: "local" })
          router.push("/auth/login")
        }}
        onRecuperado={() => router.push("/auth/login")}
      />
    </div>
  )
}
