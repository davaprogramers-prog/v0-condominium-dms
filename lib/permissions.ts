import { UserRole } from "./types"

export const rolePermissions: Record<UserRole, {
  canAccessDashboard: boolean
  canCreateUsers: boolean
  canManageCondominium: boolean
  canViewAllData: boolean
  canEditExpenses: boolean
  canEditIncome: boolean
  canCreateSurveys: boolean
  canManageHouses: boolean
  canManageProjects: boolean
  canViewReports: boolean
  canManageInfractions: boolean
}> = {
  admin: {
    canAccessDashboard: true,
    canCreateUsers: true,
    canManageCondominium: true,
    canViewAllData: true,
    canEditExpenses: true,
    canEditIncome: true,
    canCreateSurveys: true,
    canManageHouses: true,
    canManageProjects: true,
    canViewReports: true,
    canManageInfractions: true,
  },
  propietario: {
    canAccessDashboard: true,
    canCreateUsers: false,
    canManageCondominium: false,
    canViewAllData: false,
    canEditExpenses: false,
    canEditIncome: true, // Can upload payment receipts
    canCreateSurveys: false,
    canManageHouses: false,
    canManageProjects: false,
    canViewReports: false,
    canManageInfractions: false,
  },
  arrendatario: {
    canAccessDashboard: false,
    canCreateUsers: false,
    canManageCondominium: false,
    canViewAllData: false,
    canEditExpenses: false,
    canEditIncome: false,
    canCreateSurveys: false,
    canManageHouses: false,
    canManageProjects: false,
    canViewReports: false,
    canManageInfractions: false,
  },
}

export function hasPermission(role: UserRole | undefined, permission: keyof typeof rolePermissions.admin): boolean {
  if (!role) return false
  return rolePermissions[role][permission] ?? false
}

export const publicMenuItems = [
  { title: "Encuestas", href: "/dashboard/encuestas", roles: ["admin", "propietario", "arrendatario"] },
  { title: "Documentos", href: "/dashboard/documentos", roles: ["admin", "propietario"] },
]

export const adminMenuItems = [
  { title: "Dashboard", href: "/dashboard", roles: ["admin"] },
  { title: "Casas", href: "/dashboard/casas", roles: ["admin"] },
  { title: "Gastos", href: "/dashboard/gastos", roles: ["admin"] },
  { title: "Tipos de Gastos", href: "/dashboard/tipos-gastos", roles: ["admin"] },
  { title: "Reportes", href: "/dashboard/reportes", roles: ["admin"] },
  { title: "Ingresos", href: "/dashboard/ingresos", roles: ["admin"] },
  { title: "Ingresos Variables", href: "/dashboard/ingreso-variable", roles: ["admin"] },
  { title: "Exoneraciones", href: "/dashboard/exoneraciones", roles: ["admin"] },
  { title: "Proyectos", href: "/dashboard/proyectos", roles: ["admin"] },
  { title: "Infracciones", href: "/dashboard/infracciones", roles: ["admin"] },
  { title: "Arriendos", href: "/dashboard/arriendos", roles: ["admin"] },
  { title: "Áreas Comunes", href: "/dashboard/areas-comunes", roles: ["admin"] },
  { title: "Cartolas Bancarias", href: "/dashboard/cartolas", roles: ["admin"] },
  { title: "Configuración", href: "/dashboard/configuracion", roles: ["admin"] },
]

export const ownerMenuItems = [
  { title: "Dashboard", href: "/dashboard", roles: ["propietario"] },
  { title: "Mis Pagos", href: "/dashboard/ingresos", roles: ["propietario"] },
  { title: "Encuestas", href: "/dashboard/encuestas", roles: ["propietario"] },
  { title: "Documentos", href: "/dashboard/documentos", roles: ["propietario"] },
]
