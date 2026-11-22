import { rutaCerrada } from "@/lib/auth/plataforma/ruta-cerrada"

// Sin uso en la app: aceptaba condominio y rol desde el cuerpo de la petición.
// El alta de usuarios se hace con las acciones de servidor del panel (rol en app_metadata).
export async function POST() {
  return rutaCerrada()
}
