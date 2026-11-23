// Plan determinista de datos ficticios para el Condominio Demo (sin acceso a BD).
// Montos de referencia pedidos: GC fijo 180.000, fondo de reserva 18.000, luz ~450.000,
// agua ~245.000, 4 conserjes con 730.000 en total (anticipos 150.000 incluidos), multas ~300.000.

export const GC_FIJO = 180_000
export const FONDO_RESERVA = 18_000
export const TOTAL_CASAS = 16

export type Periodo = { anio: number; mes: number }
export type Gasto = {
  clave: string
  titulo: string
  descripcion: string
  monto: number
  categoria: string
  fecha: string
  periodo: Periodo
  recibo: string | null
  logo: string | null
}
export type Cobro = {
  casa: number
  tipo: "fixed" | "variable" | "multa"
  monto: number
  descripcion: string
  periodo: Periodo
  emitido: string
  pagado: string | null
}

export const FAMILIAS = [
  ["Claudia", "Rojas"], ["Jorge", "Muñoz"], ["Valentina", "Soto"], ["Ricardo", "Díaz"],
  ["Camila", "Pérez"], ["Andrés", "Contreras"], ["Francisca", "Silva"], ["Mauricio", "Morales"],
  ["Daniela", "Fuentes"], ["Sebastián", "Torres"], ["Paula", "Araya"], ["Felipe", "Vega"],
  ["Javiera", "Castro"], ["Tomás", "Espinoza"], ["Constanza", "Reyes"], ["Ignacio", "Navarro"],
] as const

export const CONSERJES = [
  ["Pedro", "Alarcón"], ["Marta", "Rivas"], ["Luis", "Cárcamo"], ["Ana", "Paredes"],
] as const

export const casaNumero = (n: number) => `Casa ${String(n).padStart(2, "0")}`

export function crearAzar(semilla: number) {
  let a = semilla >>> 0
  const siguiente = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    siguiente,
    entero: (min: number, max: number) => min + Math.floor(siguiente() * (max - min + 1)),
    elegir: <T>(lista: readonly T[]) => lista[Math.floor(siguiente() * lista.length)],
  }
}

export const fecha = (p: Periodo, dia: number) =>
  `${p.anio}-${String(p.mes).padStart(2, "0")}-${String(Math.min(dia, diasDelMes(p))).padStart(2, "0")}`
export const diasDelMes = (p: Periodo) => new Date(Date.UTC(p.anio, p.mes, 0)).getUTCDate()
const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
export const nombreMes = (p: Periodo) => `${MESES[p.mes]} ${p.anio}`

export function periodosHasta(hoy: string): Periodo[] {
  const [anio, mes] = hoy.split("-").map(Number)
  const lista: Periodo[] = []
  for (let m = 3; m <= mes; m++) lista.push({ anio, mes: m })
  return lista
}

const LUZ: Record<number, number> = { 3: 432_180, 4: 441_520, 5: 458_340, 6: 472_910, 7: 468_250, 8: 455_670, 9: 447_030, 10: 438_760, 11: 444_390 }
const AGUA: Record<number, number> = { 3: 255_420, 4: 241_870, 5: 236_150, 6: 232_480, 7: 234_910, 8: 238_300, 9: 243_660, 10: 249_120, 11: 258_740 }

export function planGastos(periodos: Periodo[], hoy: string): Gasto[] {
  const gastos: Gasto[] = []
  const agregar = (g: Omit<Gasto, "clave">) => {
    if (g.fecha <= hoy) gastos.push({ ...g, clave: `${g.periodo.mes}:${g.titulo}` })
  }
  for (const p of periodos) {
    const m = p.mes
    agregar({ titulo: "Electricidad áreas comunes", descripcion: `Boleta CGE ${nombreMes(p)}: iluminación, bombas y portón`, monto: LUZ[m] ?? 450_000, categoria: "Servicios básicos", fecha: fecha(p, 18), periodo: p, recibo: "boleta-electricidad", logo: "CGE" })
    agregar({ titulo: "Agua potable áreas comunes", descripcion: `Consumo de riego, piscina y baños comunes ${nombreMes(p)}`, monto: AGUA[m] ?? 245_000, categoria: "Servicios básicos", fecha: fecha(p, 12), periodo: p, recibo: "boleta-servicio-1", logo: null })
    CONSERJES.forEach(([nombre, apellido], i) => {
      agregar({ titulo: `Anticipo ${nombre} ${apellido}`, descripcion: "Anticipo quincena (parte del sueldo mensual)", monto: 37_500, categoria: "Anticipo", fecha: fecha(p, 15), periodo: p, recibo: i % 2 ? "transferencia-1" : "transferencia-2", logo: null })
      agregar({ titulo: `Sueldo ${nombre} ${apellido}`, descripcion: "Saldo de sueldo (descontado el anticipo de $37.500)", monto: 145_000, categoria: "Sueldos", fecha: fecha(p, 30), periodo: p, recibo: i % 2 ? "transferencia-2" : "transferencia-1", logo: "Previred" })
    })
    agregar({ titulo: "Administración", descripcion: "Honorarios de administración del mes", monto: 250_000, categoria: "Administración", fecha: fecha(p, 5), periodo: p, recibo: "comprobante-1", logo: null })
    agregar({ titulo: "Jardinería", descripcion: "Mantención mensual de áreas verdes", monto: 120_000, categoria: "Mantenimiento", fecha: fecha(p, 8), periodo: p, recibo: "boleta-servicio-2", logo: null })
    agregar({ titulo: "Artículos de aseo", descripcion: "Cloro, detergente, bolsas de basura y papel", monto: 58_000 + (m % 3) * 4_350, categoria: "Operacionales", fecha: fecha(p, 10), periodo: p, recibo: "boleta-servicio-3", logo: "Jumbo" })
    agregar({ titulo: "Seguro áreas comunes", descripcion: "Prima mensual póliza incendio y responsabilidad civil", monto: 48_200, categoria: "Seguros", fecha: fecha(p, 3), periodo: p, recibo: "comprobante-2", logo: null })
    agregar({ titulo: "Comisión cuenta corriente", descripcion: "Mantención plan cuenta corriente del condominio", monto: 12_490, categoria: "Operacionales", fecha: fecha(p, 28), periodo: p, recibo: null, logo: null })
    if (m % 2 === 0) agregar({ titulo: "Mantención portón eléctrico", descripcion: "Revisión bimestral de motor, cremallera y control", monto: 55_000, categoria: "Mantenimiento", fecha: fecha(p, 20), periodo: p, recibo: "boleta-servicio-2", logo: null })
    if (m % 3 === 0) agregar({ titulo: "Mantención bombas de agua", descripcion: "Revisión trimestral sala de bombas y presurizador", monto: 90_000, categoria: "Mantenimiento", fecha: fecha(p, 22), periodo: p, recibo: "boleta-servicio-1", logo: null })
    if (m % 3 === 1) agregar({ titulo: "Control de plagas", descripcion: "Desratización y fumigación trimestral de áreas comunes", monto: 70_000, categoria: "Mantenimiento", fecha: fecha(p, 24), periodo: p, recibo: "boleta-servicio-3", logo: null })
    if (m % 2 === 1) agregar({ titulo: "Retiro de residuos voluminosos", descripcion: "Retiro de escombros y ramas", monto: 40_000, categoria: "Operacionales", fecha: fecha(p, 26), periodo: p, recibo: null, logo: null })
  }
  const extra = (mes: number, dia: number, titulo: string, descripcion: string, monto: number, categoria: string, recibo: string | null, logo: string | null) => {
    const p = periodos.find((x) => x.mes === mes)
    if (p) agregar({ titulo, descripcion, monto, categoria, fecha: fecha(p, dia), periodo: p, recibo, logo })
  }
  extra(5, 14, "Cámaras CCTV (cuota 1/3)", "Proyecto de mejora: instalación de 8 cámaras y grabador", 383_000, "Proyectos", "comprobante-1", null)
  extra(6, 14, "Cámaras CCTV (cuota 2/3)", "Proyecto de mejora: instalación de 8 cámaras y grabador", 383_000, "Proyectos", "comprobante-1", null)
  extra(7, 14, "Cámaras CCTV (cuota 3/3)", "Proyecto de mejora: instalación de 8 cámaras y grabador", 384_000, "Proyectos", "comprobante-1", null)
  extra(6, 9, "Ampolletas LED pasajes", "Proyecto de mejora: recambio de 24 luminarias a LED", 85_400, "Proyectos", "boleta-servicio-3", "SODIMAC")
  extra(7, 11, "Reparación garita", "Cambio de chapa y vidrio de la garita de conserjería", 95_000, "Mantenimiento", "boleta-servicio-2", null)
  extra(9, 6, "Reparación luminaria acceso", "Reposición de foco quemado tras corte de luz", 32_500, "Mantenimiento", "boleta-servicio-3", "SODIMAC")
  extra(10, 21, "Reparación piscina (anticipo 50%)", "Proyecto de mejora: cambio de bomba y filtro", 90_000, "Proyectos", "comprobante-2", null)
  extra(11, 19, "Reparación piscina (saldo 50%)", "Proyecto de mejora: cambio de bomba y filtro", 90_000, "Proyectos", "comprobante-2", null)
  return gastos
}

// Casas morosas fijas para mostrar deuda: (casa, mes) que quedan pendientes.
const PENDIENTES = new Set(["7:8", "11:10", "11:11", "14:11", "5:11"])
// Pago atrasado: período pagado el mes siguiente.
const ATRASADOS = new Set(["3:6"])

export function planCobros(periodos: Periodo[], hoy: string): Cobro[] {
  const azar = crearAzar(20260301)
  const cobros: Cobro[] = []
  for (const p of periodos) {
    const emitido = fecha(p, 1)
    for (let casa = 1; casa <= TOTAL_CASAS; casa++) {
      const clave = `${casa}:${p.mes}`
      let pagado: string | null = fecha(p, azar.entero(2, 10))
      if (ATRASADOS.has(clave)) pagado = fecha({ anio: p.anio, mes: p.mes + 1 }, 4)
      if (PENDIENTES.has(clave) || (pagado && pagado > hoy)) pagado = null
      cobros.push({ casa, tipo: "fixed", monto: GC_FIJO, descripcion: `Gasto Común Fijo - ${casaNumero(casa)}`, periodo: p, emitido, pagado })
      cobros.push({ casa, tipo: "variable", monto: FONDO_RESERVA, descripcion: `Fondo de Reserva - ${casaNumero(casa)}`, periodo: p, emitido, pagado })
    }
    const multas: [number, string][] = [
      [100_000, "Estacionar en estacionamiento de visitas por más de 24 h"],
      [100_000, "Estacionar frente al portón bloqueando el acceso"],
      [50_000, "Estacionar sobre área verde"],
      [50_000, "Estacionar en doble fila en pasaje"],
    ]
    for (const [monto, motivo] of multas) {
      const casa = azar.entero(1, TOTAL_CASAS)
      let dia = azar.entero(5, 25)
      const diaHoy = hoy.startsWith(fecha(p, 1).slice(0, 7)) ? Number(hoy.slice(8, 10)) : 31
      if (dia + 3 > diaHoy) dia = Math.max(1, diaHoy - 3 - azar.entero(0, 8))
      const pagadoMulta = fecha(p, Math.min(dia + 3, 28))
      if (pagadoMulta > hoy) continue
      cobros.push({ casa, tipo: "multa", monto, descripcion: `Multa estacionamiento - ${casaNumero(casa)}: ${motivo}`, periodo: p, emitido: fecha(p, dia), pagado: pagadoMulta })
    }
  }
  return cobros
}

export type ResumenMes = { periodo: Periodo; ingresos: number; reserva: number; multas: number; egresos: number; saldoMes: number; acumulado: number }

// Mismo criterio que el balance de la app: ingresos aprobados por período, egresos por período.
export function resumenMensual(periodos: Periodo[], cobros: Cobro[], gastos: Gasto[], saldoInicial: number): ResumenMes[] {
  let acumulado = saldoInicial
  return periodos.map((p) => {
    const pagados = cobros.filter((c) => c.pagado && c.periodo.mes === p.mes && c.periodo.anio === p.anio)
    const ingresos = pagados.reduce((s, c) => s + c.monto, 0)
    const reserva = pagados.filter((c) => c.tipo === "variable").reduce((s, c) => s + c.monto, 0)
    const multas = pagados.filter((c) => c.tipo === "multa").reduce((s, c) => s + c.monto, 0)
    const egresos = gastos.filter((g) => g.periodo.mes === p.mes && g.periodo.anio === p.anio).reduce((s, g) => s + g.monto, 0)
    acumulado += ingresos - egresos
    return { periodo: p, ingresos, reserva, multas, egresos, saldoMes: ingresos - egresos, acumulado }
  })
}
