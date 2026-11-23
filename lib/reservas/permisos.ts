/** Rechazar una reserva es exclusivo del administrador del condominio (o super admin efectivo). */
export function puedeRechazarReservas(rol: string | null | undefined, esSuperAdminEfectivo: boolean): boolean {
  return rol === "admin" || (rol === "super_admin" && esSuperAdminEfectivo)
}
