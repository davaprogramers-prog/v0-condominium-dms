"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
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
import { deleteAdmin } from "./actions"

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
      const result = await deleteAdmin(userId)
      
      if (!result.success) {
        alert("Error al eliminar: " + result.error)
        setLoading(false)
        return
      }
      
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
        <Button 
          size="sm" 
          className="bg-red-600 text-white hover:bg-red-700 border-0"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg">Eliminar Administrador</AlertDialogTitle>
          <AlertDialogDescription className="text-sm pt-2">
            ¿Estás seguro de eliminar a <strong className="text-foreground">{userEmail}</strong>? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel className="bg-slate-200 text-slate-900 hover:bg-slate-300 border-0">
            Cancelar
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={loading}
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
