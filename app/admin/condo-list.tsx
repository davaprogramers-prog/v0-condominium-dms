"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, ExternalLink, Loader2, Check } from "lucide-react"

interface Condo {
  id: string
  name: string
  created_at: string
  logo_url?: string | null
}

interface CondoListProps {
  condos: Condo[]
  currentCondoId?: string
}

export function CondoList({ condos, currentCondoId }: CondoListProps) {
  const [switching, setSwitching] = useState<string | null>(null)
  const router = useRouter()

  async function handleSwitchCondo(condoId: string) {
    if (condoId === currentCondoId) {
      // Already on this condo, just go to dashboard
      router.push("/dashboard")
      return
    }

    setSwitching(condoId)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error("No autenticado")

      // Update user's condo_id
      const { error } = await supabase
        .from("profiles")
        .update({ condo_id: condoId })
        .eq("id", user.id)

      if (error) throw error

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("Error switching condo:", err)
      setSwitching(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold">Nombre</th>
            <th className="px-4 py-3 text-left font-semibold">Fecha de Creacion</th>
            <th className="px-4 py-3 text-left font-semibold">Estado</th>
            <th className="px-4 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {condos?.map((condo) => {
            const isActive = condo.id === currentCondoId
            const isSwitching = switching === condo.id
            
            return (
              <tr 
                key={condo.id} 
                className={`border-b transition-colors ${isActive ? "bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {condo.logo_url ? (
                      <Image
                        src={condo.logo_url}
                        alt={condo.name}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded object-contain"
                      />
                    ) : (
                      <Building2 className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                    <span className="font-medium">{condo.name}</span>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(condo.created_at).toLocaleDateString("es-CL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </td>
                <td className="px-4 py-3">
                  {isActive ? (
                    <span className="text-xs text-green-600 font-medium">Conectado</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    onClick={() => handleSwitchCondo(condo.id)}
                    disabled={isSwitching}
                  >
                    {isSwitching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cambiando...
                      </>
                    ) : isActive ? (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ir al Dashboard
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Seleccionar
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!condos?.length && (
        <div className="p-6 text-center text-muted-foreground">
          No hay condominios registrados
        </div>
      )}
    </div>
  )
}
