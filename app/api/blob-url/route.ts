import { rutaCerrada } from "@/lib/auth/plataforma/ruta-cerrada"

// Sin uso en la app y sin autenticación: generaba URLs de descarga de cualquier archivo privado.
export async function POST() {
  return rutaCerrada()
}
