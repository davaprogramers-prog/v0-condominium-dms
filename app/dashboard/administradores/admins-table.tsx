'use client'

import { Users } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"
import { CreateAdminDialog } from "./create-admin-dialog"
import { DeleteUserButton } from "./delete-user-button"
import { EditAdminDialog } from "./edit-admin-dialog"
import { AdminThemeToggle } from "./admin-theme-toggle"

interface Admin {
  id: string
  email: string
  first_name: string
  last_name: string | null
  created_at: string
  can_change_theme: boolean | null
  house_id: string | null
}

interface AdminsTableProps {
  admins: Admin[]
  condoId: string
  condoName: string
  houses: any[]
}

export function AdminsTable({ admins, condoId, condoName, houses }: AdminsTableProps) {
  const { cardBgColor, cardTextColor, borderColor } = useTheme()

  return (
    <div
      className="rounded-lg border p-6 space-y-4"
      style={{
        backgroundColor: cardBgColor,
        borderColor: borderColor,
        color: cardTextColor
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: cardTextColor }}>
          <Users className="h-5 w-5" />
          Administradores del Condominio
        </h2>
        <CreateAdminDialog condoId={condoId} condoName={condoName} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderColor: borderColor }} className="border-b">
              <th className="px-4 py-3 text-left font-semibold" style={{ color: cardTextColor }}>Nombre</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: cardTextColor }}>Email</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: cardTextColor }}>Propiedad</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: cardTextColor }}>Fecha de Creación</th>
              <th className="px-4 py-3 text-left font-semibold text-center" style={{ color: cardTextColor }}>Cambiar Tema</th>
              <th className="px-4 py-3 text-left font-semibold" style={{ color: cardTextColor }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(admins || []).map((admin) => (
              <tr key={admin.id} style={{ borderColor: borderColor }} className="border-b hover:opacity-80">
                <td className="px-4 py-3 font-medium" style={{ color: cardTextColor }}>
                  {admin.first_name} {admin.last_name || ""}
                </td>
                <td className="px-4 py-3" style={{ color: cardTextColor, opacity: 0.7 }}>
                  {admin.email}
                </td>
                <td className="px-4 py-3" style={{ color: cardTextColor, opacity: 0.7 }}>
                  {admin.house_id ? (
                    <>
                      Casa #{houses.find(h => h.id === admin.house_id)?.house_number || "?"}
                    </>
                  ) : (
                    <span opacity-50>Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3" style={{ color: cardTextColor, opacity: 0.7 }}>
                  {new Date(admin.created_at).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 flex justify-center">
                  <AdminThemeToggle adminId={admin.id} canChangeTheme={admin.can_change_theme || false} />
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <EditAdminDialog 
                    adminId={admin.id}
                    adminEmail={admin.email}
                    currentHouseId={admin.house_id || undefined}
                    houses={houses}
                    condoId={condoId}
                  />
                  {admin.id && admin.email ? (
                    <DeleteUserButton userId={admin.id} userEmail={admin.email} />
                  ) : (
                    <span className="text-xs" style={{ color: cardTextColor, opacity: 0.6 }}>N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {(!admins || admins.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center" style={{ color: cardTextColor, opacity: 0.7 }}>
                  No hay administradores registrados para este condominio
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
