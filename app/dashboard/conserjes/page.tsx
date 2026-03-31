"use client"

import { getConcierges } from "./actions"
import { CreateConciergeDialog } from "./create-concierge-dialog"
import { useAsync } from "@/lib/hooks/use-async"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trash2, Mail, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteConcierge } from "./actions"
import { useState } from "react"

export default function ConserjesPage() {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  // We need to get the user's condo_id from props or context
  // For now, we'll use a placeholder - this should come from the layout
  const condoId = typeof window !== "undefined" ? localStorage.getItem("condo_id") || "" : ""

  const { data: concierges = [], isLoading } = useAsync(() => {
    if (!condoId) return Promise.resolve([])
    return getConcierges(condoId)
  }, [condoId])

  async function handleDelete(profileId: string) {
    if (!condoId) return
    setDeleting(profileId)
    try {
      await deleteConcierge(condoId, profileId)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting concierge:", error)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Conserjes</h1>
          <p className="text-muted-foreground">Administra los conserjes del condominio</p>
        </div>
        <CreateConciergeDialog condoId={condoId} />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      ) : concierges.length === 0 ? (
        <Card className="p-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-muted-foreground">No hay conserjes registrados aún</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {concierges.map((concierge: any) => (
            <Card key={concierge.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {concierge.first_name} {concierge.last_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Mail className="h-4 w-4" />
                      <span>ID: {concierge.id.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(concierge.id)}
                  disabled={deleting === concierge.id}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
