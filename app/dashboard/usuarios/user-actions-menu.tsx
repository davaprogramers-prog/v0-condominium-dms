'use client'

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit2, Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { deleteUser } from "./actions"
import { EditUserDialog } from "./edit-user-dialog"
import { useTheme } from "@/app/dashboard/theme-context"

interface UserActionsMenuProps {
  user: any
  condos: Array<{ id: string; name: string }>
}

export function UserActionsMenu({ user, condos }: UserActionsMenuProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  
  const dialogBgColor = theme?.dialogBgColor || "#ffffff"
  const dialogTextColor = theme?.dialogTextColor || "#000000"

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteUser(user.id)
      if (result.error) {
        console.error("[v0] Error deleting user:", result.error)
      } else {
        router.refresh()
      }
    } finally {
      setDeleting(false)
      setShowDeleteAlert(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" style={{ borderColor: dialogTextColor + "40" }}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="border-2"
          style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}
        >
          <DropdownMenuItem onClick={() => setShowEditDialog(true)} style={{ color: dialogTextColor }}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        user={user}
        condos={condos}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent 
          className="border-2"
          style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: dialogTextColor }}>Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
              ¿Estás seguro que deseas eliminar a {user.first_name} {user.last_name}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 pt-4 justify-end">
            <AlertDialogCancel style={{ color: dialogTextColor, borderColor: dialogTextColor }}>
              Cancelar
            </AlertDialogCancel>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
