'use client'

import { CreateUserDialog } from "./create-user-dialog"
import { UserActionsMenu } from "./user-actions-menu"
import { useTheme } from "@/app/dashboard/theme-context"

interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  condo_id: string
}

interface UsuariosClientProps {
  users: UserProfile[]
  isAdmin: boolean
  isSuperAdmin: boolean
  condos: any[]
}

export function UsuariosClient({ users, isAdmin, isSuperAdmin, condos }: UsuariosClientProps) {
  const { cardBgColor, cardTextColor } = useTheme()

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700",
    admin: "bg-blue-100 text-blue-700",
    conserje: "bg-purple-100 text-purple-700",
    propietario: "bg-green-100 text-green-700",
    arrendatario: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">Gestión de administradores, residentes y arrendatarios</p>

      <div className="flex items-center justify-center">
        {(isAdmin || isSuperAdmin) && (
          <CreateUserDialog condos={condos} isSuperAdmin={isSuperAdmin} />
        )}
      </div>

      {/* Información de Roles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "admin", label: "Administrador", desc: "Gestión completa" },
          { role: "conserje", label: "Conserje", desc: "Gestión de solicitudes" },
          { role: "propietario", label: "Residente", desc: "Subir comprobantes" },
          { role: "arrendatario", label: "Arrendatario", desc: "Acceso limitado" },
        ].map((item) => (
          <div key={item.role} className="rounded-lg border bg-card p-4">
            <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${roleColors[item.role] || "bg-gray-100 text-gray-700"}`}>
              {item.label}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Lista de Usuarios */}
      <div className="rounded-lg border">
        {!users?.length ? (
          <div className="p-6 text-center text-muted-foreground">
            No hay usuarios registrados aún
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users?.map((u) => (
                <div
                  key={u.id}
                  className="rounded-lg border-2 p-4 hover:shadow-md transition-shadow"
                  style={{
                    backgroundColor: cardBgColor,
                    borderColor: cardBgColor,
                    color: cardTextColor
                  }}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header with name and role */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase opacity-75">Usuario</p>
                        <h3 className="text-xl font-bold" style={{ color: cardTextColor }}>
                          {u.first_name} {u.last_name || ""}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${roleColors[u.role] || "bg-gray-100 text-gray-700"}`}>
                        {u.role?.replace("_", " ")}
                      </span>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-xs font-medium uppercase opacity-75">Email</p>
                      <p className="text-sm truncate" style={{ color: cardTextColor, opacity: 0.8 }}>
                        {u.email || "-"}
                      </p>
                    </div>

                    {/* Fecha de Registro */}
                    <div>
                      <p className="text-xs font-medium uppercase opacity-75">Fecha Registro</p>
                      <p className="font-semibold" style={{ color: cardTextColor }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Actions */}
                    {isSuperAdmin && (
                      <UserActionsMenu user={u} condos={condos} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
