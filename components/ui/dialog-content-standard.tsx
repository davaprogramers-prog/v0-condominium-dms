import { DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface StandardDialogContentProps {
  children: ReactNode
  className?: string
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
  scrollable?: boolean
}

export function StandardDialogContent({
  children,
  className,
  maxWidth = "md",
  scrollable = false,
}: StandardDialogContentProps) {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth]

  return (
    <DialogContent
      className={cn(
        "bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700",
        scrollable && "max-h-[90vh] overflow-y-auto",
        maxWidthClass,
        className
      )}
    >
      {children}
    </DialogContent>
  )
}
