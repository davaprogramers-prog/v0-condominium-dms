const ZONA_CHILE = "America/Santiago"

/** Fecha AAAA-MM-DD en hora de Chile. */
export function fechaChile(fecha: Date | string | number = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_CHILE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(fecha))
}

/**
 * Regla de la demo (espejo de fn_demo_puede_editar_usuario, scripts/155): solo se modifica lo que el
 * mismo usuario creó hoy en hora de Chile. Solo sirve para mostrar u ocultar botones; el servidor decide.
 */
export function demoPuedeEditar(
  fila: { created_by?: string | null; created_at?: string | null },
  userId: string | null | undefined,
  ahora: Date = new Date(),
): boolean {
  if (!userId || !fila.created_by || !fila.created_at) return false
  return fila.created_by === userId && fechaChile(fila.created_at) === fechaChile(ahora)
}
