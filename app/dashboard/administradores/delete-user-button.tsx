"use client"

import { useState } from "react"
import { useTheme } from "@/app/dashboard/theme-context"
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
  const { dialogBgColor, dialogTextColor, inputTextColor } = useTheme()

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
      <AlertDialogContent 
        className="max-w-sm"
        style={{
          backgroundColor: dialogBgColor,
          borderColor: inputTextColor,
          color: dialogTextColor
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg" style={{ color: dialogTextColor }}>Eliminar Administrador</AlertDialogTitle>
          <AlertDialogDescription className="text-sm pt-2" style={{ color: dialogTextColor, opacity: 0.7 }}>
            ¿Estás seguro de eliminar a <strong style={{ color: dialogTextColor }}>{userEmail}</strong>? 
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 pt-4">
          <AlertDialogCancel 
            style={{
              backgroundColor: dialogBgColor,
              color: dialogTextColor,
              borderColor: inputTextColor
            }}
            className="border"
          >
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
