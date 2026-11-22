export const CAPACIDADES = [
  "condominios.gestionar",
  "super_admins.gestionar",
  "seguridad.gestionar",
  "auditoria.ver",
  "condominio.operar",
] as const

export type Capacidad = (typeof CAPACIDADES)[number]

/** Capacidad que exige cada superficie de plataforma. Toda ruta nueva se agrega aquí y en las pruebas. */
export const SUPERFICIES_PLATAFORMA = {
  "/plataforma": "condominios.gestionar",
  "/plataforma/super-admins": "super_admins.gestionar",
  "/plataforma/seguridad": "seguridad.gestionar",
  "/plataforma/auditoria": "auditoria.ver",
  "GET /api/super-admin/condos": "condominios.gestionar",
  "POST /api/super-admin/condos": "condominios.gestionar",
  "DELETE /api/super-admin/condos/[id]": "condominios.gestionar",
  "POST /api/admin/create-user": "condominios.gestionar",
  "POST /api/admin/theme-permission": "condominios.gestionar",
  "dashboard:operar-condominio": "condominio.operar",
} as const satisfies Record<string, Capacidad>

/** Acciones que además exigen haber validado el código TOTP hace poco. */
export const ACCIONES_MFA_RECIENTE = [
  "super_admin.alta",
  "super_admin.desactivar",
  "condominio.eliminar",
  "mfa.quitar_factor",
  "mfa.regenerar_codigos",
  "sesiones.cerrar_todas",
] as const

export type AccionMfaReciente = (typeof ACCIONES_MFA_RECIENTE)[number]

export const MFA_RECIENTE_SEGUNDOS = 10 * 60
export const REAUTENTICACION_SEGUNDOS = 10 * 60
