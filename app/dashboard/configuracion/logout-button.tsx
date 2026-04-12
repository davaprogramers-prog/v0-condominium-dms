"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <Button 
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white font-semibold"
    >
      Cerrar Sesión
    </Button>
  )
}
