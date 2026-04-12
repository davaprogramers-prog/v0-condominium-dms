'use client'

import { useEffect, useState } from 'react'
import { Users, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [condos, setCondos] = useState<any[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { cardBgColor, cardTextColor } = useTheme()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/profile')
        if (!profileRes.ok) throw new Error('Failed to fetch profile')
        const profile = await profileRes.json()
        
        setIsAdmin(profile.role === 'admin')
        setIsSuperAdmin(profile.role === 'super_admin')

        // Fetch users
        const usersRes = await fetch(`/api/users?condo_id=${profile.condo_id}`)
        if (!usersRes.ok) throw new Error('Failed to fetch users')
        const usersData = await usersRes.json()
        setUsers(usersData)

        // Fetch condos if super_admin
        if (profile.role === 'super_admin') {
          const condosRes = await fetch('/api/condos')
          if (condosRes.ok) {
            const condosData = await condosRes.json()
            setCondos(condosData)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-100 text-red-700",
    admin: "bg-blue-100 text-blue-700",
    conserje: "bg-purple-100 text-purple-700",
    propietario: "bg-green-100 text-green-700",
    arrendatario: "bg-amber-100 text-amber-700",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestión de administradores, propietarios y arrendatarios</p>
        </div>
        {(isAdmin || isSuperAdmin) && (
          <CreateUserDialog condos={condos} isSuperAdmin={isSuperAdmin} />
        )}
      </div>

      {/* Información de Roles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { role: "admin", label: "Administrador", desc: "Gestión completa" },
          { role: "conserje", label: "Conserje", desc: "Gestión de solicitudes" },
          { role: "propietario", label: "Propietario", desc: "Subir comprobantes" },
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
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            Cargando usuarios...
          </div>
        ) : !users?.length ? (
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

