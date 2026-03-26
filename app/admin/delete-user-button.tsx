"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface DeleteUserButtonProps {
  userId: string
  userEmail: string
}

export function DeleteUserButton({ userId, userEmail }: DeleteUserButtonProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Delete from profiles table first
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (profileError) {
        console.error("Error deleting profile:", profileError)
        alert("Error al eliminar el perfil: " + profileError.message)
        setLoading(false)
        return
      }

      // Note: Deleting from auth.users requires admin API or service role
      // The profile deletion is enough to revoke access
      
      setOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Error al eliminar el usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Administrador</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de eliminar a <strong>{userEmail}</strong>? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={loading}
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
