/**
 * Un cobro (condo_income) nace "pending" y pasa a "approved" solo cuando se registra su pago.
 * Aprobado = pagado, tenga o no comprobante adjunto (pagos en efectivo, cargas históricas).
 */
export function cobroPagado(cobro: { status?: string | null }): boolean {
  return cobro.status === "approved"
}

export function cobrosAdeudados<T extends { status?: string | null }>(cobros: T[] | null | undefined): T[] {
  return (cobros ?? []).filter((cobro) => !cobroPagado(cobro))
}
