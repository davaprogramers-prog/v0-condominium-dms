/**
 * La vista previa de v0 carga la app dentro de un iframe de otro sitio: ahí el navegador
 * no guarda ni envía cookies SameSite=Lax, así que la sesión iniciada en el servidor
 * nunca llegaba al middleware (bucle /dashboard → /auth/login). En desarrollo se usa
 * SameSite=None; Secure. En producción se mantiene Lax.
 */
export const opcionesCookieSesion = {
  sameSite: process.env.NODE_ENV === "production" ? ("lax" as const) : ("none" as const),
  secure: true,
}
