"use client"

import { useState } from "react"
import { Bell, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Notification {
  id: string
  type: string
  reference_id?: string
  title: string
  message?: string
  is_read: boolean
  created_at: string
}

interface NotificationBellProps {
  notifications: Notification[]
  unreadCount: number
  condoId: string
}

export function NotificationBell({
  notifications,
  unreadCount,
  condoId,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)

  const pendingPayments = notifications.filter((n) => n.type === "payment_pending" && !n.is_read)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
        </div>

        {notifications.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tienes notificaciones
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition ${
                  notif.is_read ? "opacity-60" : "bg-blue-50"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    {notif.message && (
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleDateString("es-CL")}
                    </p>
                  </div>

                  {/* Payment approval buttons */}
                  {notif.type === "payment_pending" && notif.reference_id && (
                    <div className="flex gap-1">
                      <Link href={`/dashboard/ingresos?approve=${notif.reference_id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-green-100 hover:bg-green-200">
                          <Check className="h-4 w-4 text-green-700" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/ingresos?reject=${notif.reference_id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200">
                          <X className="h-4 w-4 text-red-700" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingPayments.length > 0 && (
          <div className="p-4 border-t">
            <Link href={`/dashboard/ingresos`}>
              <Button className="w-full" variant="outline">
                Ver todos los pagos pendientes
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
