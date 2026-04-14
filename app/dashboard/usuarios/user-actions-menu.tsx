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

interface UserActionsMenuProps {
  user: any
  condos: Array<{ id: string; name: string }>
}

export function UserActionsMenu({ user, condos }: UserActionsMenuProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

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
          <Button size="sm" className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-300">
            <MoreHorizontal className="h-4 w-4" style={{ color: "#64748b" }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="dark:text-white">
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-destructive dark:text-red-400"
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
        <AlertDialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900 dark:text-white">Eliminar usuario</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              ¿Estás seguro que deseas eliminar a {user.first_name} {user.last_name}? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 pt-4 justify-end">
            <AlertDialogCancel className="bg-slate-200 text-slate-900 hover:bg-slate-300 border-0">
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
