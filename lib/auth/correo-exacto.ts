/**
 * Patrón para `.ilike(columna, patron)` que equivale a "mismo correo, sin distinguir mayúsculas".
 * Sin esto, `%` y `_` del texto del usuario actúan como comodines (`%@%` listaba todas las casas y
 * `juan_perez@` calzaba con `juan.perez@`). PostgREST además traduce `*` a `%`, así que se rechaza.
 * Devuelve null si el correo trae caracteres que no se pueden comparar de forma segura.
 */
export function patronCorreoExacto(correo: string): string | null {
  const email = String(correo || "").trim().toLowerCase()
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email)) return null
  if (/[%*\\]/.test(email)) return null
  return email.replace(/_/g, "\\_")
}
