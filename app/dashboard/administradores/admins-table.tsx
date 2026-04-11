'use client'

import { Users } from "lucide-react"
import { CreateAdminDialog } from "./create-admin-dialog"
import { DeleteUserButton } from "./delete-user-button"
import { AdminThemeToggle } from "./admin-theme-toggle"

interface Admin {
  id: string
  email: string
  first_name: string
  last_name: string | null
  created_at: string
  can_change_theme: boolean | null
}

interface AdminsTableProps {
  admins: Admin[]
  condoId: string
  condoName: string
}

export function AdminsTable({ admins, condoId, condoName }: AdminsTableProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Administradores del Condominio
        </h2>
        <CreateAdminDialog condoId={condoId} condoName={condoName} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">Fecha de Creación</th>
              <th className="px-4 py-3 text-left font-semibold text-center">Cambiar Tema</th>
              <th className="px-4 py-3 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {(admins || []).map((admin) => (
              <tr key={admin.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">
                  {admin.first_name} {admin.last_name || ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {admin.email}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(admin.created_at).toLocaleDateString("es-CL")}
                </td>
                <td className="px-4 py-3 flex justify-center">
                  <AdminThemeToggle adminId={admin.id} canChangeTheme={admin.can_change_theme || false} />
                </td>
                <td className="px-4 py-3">
                  {admin.id && admin.email ? (
                    <DeleteUserButton userId={admin.id} userEmail={admin.email} />
                  ) : (
                    <span className="text-xs text-muted-foreground">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {(!admins || admins.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
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
