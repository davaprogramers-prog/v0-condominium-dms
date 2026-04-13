'use client'

import { getConcierges, updateConcierge } from "./actions"
import { CreateConciergeDialog } from "./create-concierge-dialog"
import { useTheme } from "../theme-context"
import { useAsync } from "@/lib/hooks/use-async"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Mail, User, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteConcierge } from "./actions"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function ConserjesPage() {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [condoId, setCondoId] = useState<string>("")
  const [loadingCondo, setLoadingCondo] = useState(true)
  const [userRole, setUserRole] = useState<string>("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "" })
  const [isSaving, setIsSaving] = useState(false)
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor, cardBgColor, cardTextColor, borderColor } = useTheme()

  // Get condo_id and role from authenticated user
  useEffect(() => {
    const fetchCondoId = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoadingCondo(false)
          return
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("condo_id, role")
          .eq("id", user.id)
          .single()

        if (profile?.condo_id) {
          setCondoId(profile.condo_id)
          setUserRole(profile.role || "")
        }
      } catch (error) {
        console.error("[v0] Error fetching condo_id:", error)
      } finally {
        setLoadingCondo(false)
      }
    }

    fetchCondoId()
  }, [])

  const { data: concierges = [], isLoading, refetch } = useAsync(() => {
    if (!condoId) return Promise.resolve([])
    return getConcierges(condoId)
  }, true, [condoId])

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

  function handleEditClick(concierge: any) {
    setEditingId(concierge.id)
    setEditForm({
      firstName: concierge.first_name,
      lastName: concierge.last_name
    })
  }

  async function handleSaveEdit() {
    if (!condoId || !editingId) return
    
    setIsSaving(true)
    try {
      await updateConcierge(condoId, editingId, {
        firstName: editForm.firstName,
        lastName: editForm.lastName
      })
      setEditingId(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating concierge:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Only admins and super_admins can manage concierges
  const canManageConcierges = userRole === 'admin' || userRole === 'super_admin'

  if (loadingCondo) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-1/3 mb-4" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!canManageConcierges) {
    return (
      <Card style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }} className="p-12 text-center">
        <User className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: cardTextColor }} />
        <p style={{ color: cardTextColor, opacity: 0.7 }}>No tienes permisos para gestionar conserjes</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Conserjes</h1>
            <p className="text-muted-foreground">Administra los conserjes del condominio</p>
          </div>
          {canManageConcierges && <CreateConciergeDialog condoId={condoId} onSuccess={refetch} />}
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
        ) : !concierges || concierges.length === 0 ? (
          <Card style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }} className="p-12 text-center">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" style={{ color: cardTextColor }} />
            <p style={{ color: cardTextColor, opacity: 0.7 }}>No hay conserjes registrados aún</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {concierges.map((concierge: any) => (
              <Card key={concierge.id} style={{ backgroundColor: cardBgColor, borderColor: borderColor, color: cardTextColor }} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg" style={{ color: cardTextColor }}>
                        {concierge.first_name} {concierge.last_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm mt-2" style={{ color: cardTextColor, opacity: 0.7 }}>
                        <Mail className="h-4 w-4" />
                        <span>ID: {concierge.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleEditClick(concierge)}
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </Button>
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editingId !== null} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}>
          <DialogHeader>
            <DialogTitle style={{ color: dialogTextColor }}>Editar Conserje</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" style={{ color: dialogTextColor }}>Nombre</Label>
              <Input
                id="firstName"
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                placeholder="Nombre del conserje"
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>
            <div>
              <Label htmlFor="lastName" style={{ color: dialogTextColor }}>Apellido</Label>
              <Input
                id="lastName"
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                placeholder="Apellido del conserje"
                style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
