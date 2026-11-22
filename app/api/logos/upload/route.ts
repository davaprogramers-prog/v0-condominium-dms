import { rutaCerrada } from "@/lib/auth/plataforma/ruta-cerrada"

// Sin uso en la app y aceptaba el condominio desde el formulario. La subida de logos va por la acción uploadLogo.
export async function POST() {
  return rutaCerrada()
}
