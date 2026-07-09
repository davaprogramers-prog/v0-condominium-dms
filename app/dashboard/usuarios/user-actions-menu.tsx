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
import { MoreHorizontal, Edit2, Trash2, KeyRound, CheckCircle2, Copy } from "lucide-react"
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
import { deleteUser, resetUserPassword, DEFAULT_RESET_PASSWORD } from "./actions"
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
  const [showResetAlert, setShowResetAlert] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [resetError, setResetError] = useState("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()
  
  const dialogBgColor = theme?.dialog_bg_color || "#ffffff"
  const dialogTextColor = theme?.dialog_text_color || "#000000"

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

  const handleResetPassword = async () => {
    setResetting(true)
    setResetError("")
    try {
      const result = await resetUserPassword(user.id)
      if (result.success) {
        setResetDone(true)
      } else {
        setResetError(result.error || "Error al resetear la contraseña")
      }
    } finally {
      setResetting(false)
    }
  }

  const closeResetAlert = () => {
    setShowResetAlert(false)
    setResetDone(false)
    setResetError("")
    setCopied(false)
  }

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(DEFAULT_RESET_PASSWORD)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
          <DropdownMenuItem onClick={() => setShowResetAlert(true)} style={{ color: dialogTextColor }}>
            <KeyRound className="h-4 w-4 mr-2" />
            Resetear contraseña
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

      <AlertDialog open={showResetAlert} onOpenChange={(open) => !open && closeResetAlert()}>
        <AlertDialogContent
          className="border-2"
          style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }}
        >
          {resetDone ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2" style={{ color: dialogTextColor }}>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Contraseña reseteada
                </AlertDialogTitle>
                <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                  La contraseña de {user.first_name} {user.last_name} se restableció. Comparte esta
                  contraseña temporal con el usuario para que inicie sesión y la cambie desde &quot;Mi Cuenta&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex items-center justify-between gap-2 rounded-lg border p-3 my-2" style={{ borderColor: dialogTextColor + "40" }}>
                <code className="text-lg font-bold tracking-wide">{DEFAULT_RESET_PASSWORD}</code>
                <Button size="sm" variant="outline" onClick={handleCopyPassword} style={{ borderColor: dialogTextColor + "40", color: dialogTextColor }}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  <span className="ml-1">{copied ? "Copiado" : "Copiar"}</span>
                </Button>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={closeResetAlert} className="bg-slate-700 text-white hover:bg-slate-800">
                  Entendido
                </Button>
              </div>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2" style={{ color: dialogTextColor }}>
                  <KeyRound className="h-5 w-5" />
                  Resetear contraseña
                </AlertDialogTitle>
                <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                  Se restablecerá la contraseña de {user.first_name} {user.last_name} a la contraseña
                  temporal <strong>{DEFAULT_RESET_PASSWORD}</strong>. El usuario podrá iniciar sesión con
                  ella y cambiarla luego desde &quot;Mi Cuenta&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {resetError}
                </div>
              )}
              <div className="flex gap-2 pt-4 justify-end">
                <AlertDialogCancel style={{ color: dialogTextColor, borderColor: dialogTextColor }}>
                  Cancelar
                </AlertDialogCancel>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetting}
                  className="bg-slate-700 text-white hover:bg-slate-800"
                >
                  {resetting ? "Reseteando..." : "Resetear contraseña"}
                </Button>
              </div>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
