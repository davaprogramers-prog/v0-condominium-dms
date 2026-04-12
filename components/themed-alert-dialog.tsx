'use client'

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger, AlertDialogPortal } from "@/components/ui/alert-dialog"
import { useTheme } from "@/app/dashboard/theme-context"
import { ReactNode } from "react"

interface ThemedAlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: ReactNode
  title: string
  description?: string
  actionText?: string
  cancelText?: string
  onAction: () => void | Promise<void>
  children?: ReactNode
  destructive?: boolean
}

export function ThemedAlertDialog({
  trigger,
  title,
  description,
  actionText = "Continuar",
  cancelText = "Cancelar",
  onAction,
  children,
  destructive = false,
  ...props
}: ThemedAlertDialogProps) {
  const { dialogBgColor, dialogTextColor } = useTheme()

  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogContent
          style={{
            backgroundColor: dialogBgColor,
            color: dialogTextColor,
            borderColor: dialogBgColor,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: dialogTextColor }}>
              {title}
            </AlertDialogTitle>
            {description && (
              <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.8 }}>
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {children}
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: dialogTextColor }}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onAction}
              className={destructive ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
