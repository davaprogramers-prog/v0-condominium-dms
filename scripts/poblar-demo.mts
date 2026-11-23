// Puebla el Condominio Demo (es_demo = true) con datos ficticios desde marzo hasta hoy.
// Uso: pnpm demo:poblar            (reemplaza los datos operativos del condominio demo)
//      pnpm demo:poblar --simular  (calcula y muestra el resumen sin escribir)
// Nunca toca otro condominio: aborta si el condominio objetivo no es es_demo.
import { readFileSync } from "node:fs"
import { randomBytes } from "node:crypto"
import { join } from "node:path"
import postgres from "postgres"
import { createClient } from "@supabase/supabase-js"
import {
  CONSERJES, FAMILIAS, FONDO_RESERVA, GC_FIJO, TOTAL_CASAS, casaNumero, crearAzar, fecha,
  nombreMes, periodosHasta, planCobros, planGastos, resumenMensual, type Periodo,
} from "./datos-demo/plan.ts"

const SIMULAR = process.argv.includes("--simular")
const SALDO_INICIAL = 2_400_000
const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date())
const periodos = periodosHasta(hoy)
const gastos = planGastos(periodos, hoy)
const cobros = planCobros(periodos, hoy)
const resumen = resumenMensual(periodos, cobros, gastos, SALDO_INICIAL)
const clp = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`

console.log(`Resumen ${periodos.length} meses (saldo inicial ${clp(SALDO_INICIAL)} al 01-03):`)
for (const r of resumen) {
  console.log(
    `  ${nombreMes(r.periodo).padEnd(16)} ingresos ${clp(r.ingresos).padStart(11)} (reserva ${clp(r.reserva)}, multas ${clp(r.multas)})` +
      `  egresos ${clp(r.egresos).padStart(11)}  saldo mes ${clp(r.saldoMes).padStart(10)}  acumulado ${clp(r.acumulado)}`,
  )
}
const deficit = resumen.filter((r) => r.ingresos - r.reserva <= r.egresos)
if (deficit.length) {
  console.error("ERROR: meses con egresos >= ingresos operativos (sin fondo de reserva):", deficit.map((r) => nombreMes(r.periodo)))
  process.exit(1)
}
if (SIMULAR) process.exit(0)

const sql = postgres(process.env.POSTGRES_URL_NON_POOLING!, { ssl: "require", max: 2, onnotice: () => {} })
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const recibo = (nombre: string | null) =>
  nombre ? `data:image/jpeg;base64,${readFileSync(join(import.meta.dirname, "datos-demo/recibos", `${nombre}.jpg`)).toString("base64")}` : null

async function asegurarUsuario(email: string, nombre: string, apellido: string, rol: string, condo: string, casa: string | null) {
  const [existente] = await sql`select id from auth.users where email = ${email}`
  let id: string = existente?.id
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: randomBytes(24).toString("base64url"),
      email_confirm: true,
      app_metadata: { role: rol, poblado_demo: true },
      user_metadata: { first_name: nombre, last_name: apellido },
    })
    if (error) throw new Error(`No se pudo crear ${email}: ${error.message}`)
    id = data.user.id
  }
  await sql`
    insert into public.profiles (id, email, role, condo_id, house_id, first_name, last_name)
    values (${id}, ${email}, ${rol}, ${condo}, ${casa}, ${nombre}, ${apellido})
    on conflict (id) do update set role = excluded.role, condo_id = excluded.condo_id, house_id = excluded.house_id,
      first_name = excluded.first_name, last_name = excluded.last_name`
  return id
}

try {
  const [condo] = await sql`select id, name from public.condominiums where es_demo`
  if (!condo) throw new Error("No existe el condominio demo (es_demo = true)")
  const condoId: string = condo.id
  console.log(`\nPoblando "${condo.name}" (${condoId})`)

  for (let n = 1; n <= TOTAL_CASAS; n++) {
    const apellido = FAMILIAS[n - 1][1]
    await sql`
      insert into public.houses (condo_id, house_number, owner_name, owner_email, is_active, payment_due_day)
      values (${condoId}, ${casaNumero(n)}, ${`Familia ${apellido}`}, ${`casa${String(n).padStart(2, "0")}@demo.invalid`}, true, 10)
      on conflict (condo_id, house_number) do update set owner_name = excluded.owner_name, is_active = true`
  }
  const casasFilas = await sql`select id, house_number from public.houses where condo_id = ${condoId}`
  const casaId = (n: number) => casasFilas.find((c) => c.house_number === casaNumero(n))!.id as string

  const adminId = await asegurarUsuario("administracion@demo.invalid", "Patricia", "Gálvez", "admin", condoId, null)
  const conserjes: string[] = []
  for (const [i, [nombre, apellido]] of CONSERJES.entries())
    conserjes.push(await asegurarUsuario(`conserje${i + 1}@demo.invalid`, nombre, apellido, "conserje", condoId, null))
  const vecinos: string[] = []
  for (let n = 1; n <= TOTAL_CASAS; n++) {
    const [nombre, apellido] = FAMILIAS[n - 1]
    vecinos.push(await asegurarUsuario(`vecino${String(n).padStart(2, "0")}@demo.invalid`, nombre, apellido, "propietario", condoId, casaId(n)))
  }
  const vecino = (n: number) => vecinos[n - 1]

  const logosRef = await sql`
    select distinct on (name) name, logo_url from public.expense_logos
    where name in ('CGE', 'Previred', 'SODIMAC', 'Jumbo') order by name, created_at`
  const azar = crearAzar(20261122)

  await sql.begin(async (txRaw) => {
    const tx = txRaw as unknown as typeof sql
    await tx`delete from public.survey_votes v using public.surveys s where s.id = v.survey_id and s.condo_id = ${condoId}`
    for (const tabla of [
      "payment_proofs", "supply_requests", "condo_income", "condo_expenses", "expense_logos", "expense_types", "infractions",
      "visits", "parcels", "area_reservations", "common_areas", "alerts", "projects", "surveys", "concierge_worklogs",
      "condo_monthly_balance",
    ]) await tx.unsafe(`delete from public.${tabla} where condo_id = $1`, [condoId])

    await tx`update public.condominiums set total_houses = ${TOTAL_CASAS}, common_expense_amount = ${GC_FIJO} where id = ${condoId}`
    const [mesActual, anioActual] = [Number(hoy.slice(5, 7)), Number(hoy.slice(0, 4))]
    await tx`
      update public.parameters set fixed_income_amount = ${GC_FIJO}, variable_income_amount = ${FONDO_RESERVA},
        initial_balance = ${SALDO_INICIAL}, initial_balance_date = '2026-03-01', current_month = ${mesActual},
        current_year = ${anioActual}, payment_deadline_day = 10, updated_at = now()
      where condo_id = ${condoId}`

    for (const [nombre, descripcion] of [
      ["Servicios básicos", "Electricidad y agua de áreas comunes"], ["Sueldos", "Saldo mensual de remuneraciones de conserjería"],
      ["Anticipo", "Anticipos de quincena (parte del sueldo)"], ["Mantenimiento", "Jardinería, portón, bombas, plagas y reparaciones"],
      ["Operacionales", "Aseo, residuos y gastos bancarios"], ["Administración", "Honorarios de administración"],
      ["Seguros", "Pólizas de áreas comunes"], ["Proyectos", "Cuotas de proyectos de mejora aprobados"],
    ]) await tx`insert into public.expense_types (condo_id, name, description, is_active) values (${condoId}, ${nombre}, ${descripcion}, true)`

    const logos = new Map<string, string>()
    for (const l of logosRef) {
      const [fila] = await tx`insert into public.expense_logos (condo_id, name, logo_url) values (${condoId}, ${l.name}, ${l.logo_url}) returning id`
      logos.set(l.name, fila.id)
    }

    const recibos = new Map<string, string | null>()
    const reciboDe = (n: string | null) => {
      if (!n) return null
      if (!recibos.has(n)) recibos.set(n, recibo(n))
      return recibos.get(n)!
    }
    const gastoIds = new Map<string, string>()
    for (const g of gastos) {
      const [fila] = await tx`
        insert into public.condo_expenses (condo_id, title, description, amount, category, receipt_url, expense_date,
          period_year, period_month, created_by, expense_logo_id, created_at)
        values (${condoId}, ${g.titulo}, ${g.descripcion}, ${g.monto}, ${g.categoria}, ${reciboDe(g.recibo)}, ${g.fecha},
          ${g.periodo.anio}, ${g.periodo.mes}, ${adminId}, ${g.logo ? logos.get(g.logo) ?? null : null}, ${g.fecha + " 12:00"})
        returning id`
      gastoIds.set(g.clave, fila.id)
    }

    const ingresoIds = new Map<string, string>()
    for (const c of cobros) {
      const aprobado = c.pagado !== null
      const [fila] = await tx`
        insert into public.condo_income (condo_id, house_id, amount, income_type, description, income_date, period_year,
          period_month, created_by, status, approved_by, approved_at, created_at)
        values (${condoId}, ${casaId(c.casa)}, ${c.monto}, ${c.tipo}, ${c.descripcion}, ${c.pagado ?? c.emitido},
          ${c.periodo.anio}, ${c.periodo.mes}, ${adminId}, ${aprobado ? "approved" : "pending"},
          ${aprobado ? adminId : null}, ${aprobado ? c.pagado + " 18:00" : null}, ${c.emitido + " 08:00"})
        returning id`
      if (c.tipo !== "multa") ingresoIds.set(`${c.casa}:${c.periodo.mes}:${c.tipo}`, fila.id)
    }

    // Comprobantes de transferencia de los últimos 2 meses (aprobados) + uno por revisar.
    for (const p of periodos.slice(-2)) {
      for (let n = 1; n <= TOTAL_CASAS; n++) {
        const fijo = cobros.find((c) => c.casa === n && c.periodo.mes === p.mes && c.tipo === "fixed")!
        const pendientePorRevisar = !fijo.pagado && n === 14 && p.mes === periodos.at(-1)!.mes
        if (!fijo.pagado && !pendientePorRevisar) continue
        await tx`
          insert into public.payment_proofs (condo_id, house_id, uploaded_by, period_month, period_year, fixed_amount,
            variable_amount, receipt_url, notes, status, reviewed_by, reviewed_at, fixed_income_id,
            variable_income_id, payment_type, fines_amount, created_at)
          values (${condoId}, ${casaId(n)}, ${vecino(n)}, ${p.mes}, ${p.anio}, ${GC_FIJO}, ${FONDO_RESERVA},
            ${reciboDe(n % 2 ? "transferencia-1" : "transferencia-2")},
            ${pendientePorRevisar ? "Transferencia realizada, quedo atento a la revisión" : "Transferencia gasto común"},
            ${pendientePorRevisar ? "pending" : "approved"}, ${pendientePorRevisar ? null : adminId},
            ${pendientePorRevisar ? null : fijo.pagado + " 18:00"}, ${ingresoIds.get(`${n}:${p.mes}:fixed`)},
            ${ingresoIds.get(`${n}:${p.mes}:variable`)}, 'gastos_comunes', 0,
            ${(fijo.pagado ?? fecha(p, 20)) + " 10:00"})`
      }
    }

    // Infracciones pendientes del mes en curso (aún no pagadas: no suman al balance).
    const ultimo = periodos.at(-1)!
    for (const [casa, dia, monto, motivo] of [
      [9, 14, 100_000, "Estacionar en estacionamiento de visitas por más de 24 h"],
      [2, 19, 50_000, "Estacionar sobre área verde"],
    ] as const) {
      if (fecha(ultimo, dia) > hoy) continue
      await tx`
        insert into public.infractions (condo_id, house_id, description, fine_amount, is_paid, infraction_date, created_by, status)
        values (${condoId}, ${casaId(casa)}, ${`Multa estacionamiento: ${motivo}`}, ${monto}, false, ${fecha(ultimo, dia)}, ${adminId}, 'pendiente')`
    }

    // Espacios comunes y reservas sin choques de horario.
    const areas: Record<string, string> = {}
    for (const [nombre, descripcion, reservable, horas, abre, cierra, pagado, tarifa] of [
      ["Quincho", "Quincho techado con parrilla para 20 personas", true, 5, "10:00", "23:00", true, 15000],
      ["Sala multiuso", "Sala para reuniones y celebraciones", true, 4, "09:00", "22:00", false, 0],
      ["Piscina", "Piscina comunitaria (temporada noviembre a marzo)", false, 0, "10:00", "20:00", false, 0],
    ] as const) {
      const [fila] = await tx`
        insert into public.common_areas (condo_id, name, description, is_reservable, max_hours_per_reservation,
          opening_time, closing_time, is_paid, usage_fee)
        values (${condoId}, ${nombre}, ${descripcion}, ${reservable}, ${horas || null}, ${abre}, ${cierra}, ${pagado}, ${tarifa})
        returning id`
      areas[nombre] = fila.id
    }
    const motivosReserva = ["Cumpleaños", "Asado familiar", "Reunión de amigos", "Celebración de aniversario", "Junta de vecinos", "Taller de manualidades", "Bautizo"]
    const ocupado = new Set<string>()
    const fechasReserva: { dia: string; futura: boolean }[] = []
    for (const p of periodos) for (const d of [4, 6, 11, 13, 18, 20, 25, 27]) fechasReserva.push({ dia: fecha(p, d), futura: false })
    for (const d of ["2026-11-28", "2026-11-29", "2026-12-05", "2026-12-12"]) fechasReserva.push({ dia: d, futura: true })
    for (const { dia } of fechasReserva) {
      if (azar.siguiente() < 0.25) continue
      const area = azar.siguiente() < 0.65 ? "Quincho" : "Sala multiuso"
      if (ocupado.has(`${area}:${dia}`)) continue
      ocupado.add(`${area}:${dia}`)
      const casa = azar.entero(1, TOTAL_CASAS)
      const [inicio, fin] = area === "Quincho" ? azar.elegir([["13:00", "18:00"], ["18:00", "23:00"]]) : azar.elegir([["10:00", "14:00"], ["16:00", "20:00"]])
      const futura = dia > hoy
      const estado = futura ? (azar.siguiente() < 0.5 ? "pending" : "confirmed") : azar.siguiente() < 0.08 ? "cancelled" : "confirmed"
      await tx`
        insert into public.area_reservations (area_id, house_id, condo_id, reservation_date, start_time, end_time, status, notes, created_by)
        values (${areas[area]}, ${casaId(casa)}, ${condoId}, ${dia}, ${inicio}, ${fin}, ${estado}, ${azar.elegir(motivosReserva)}, ${vecino(casa)})`
    }

    // Visitas.
    const visitantes = ["Carolina Fuentes", "Matías Herrera", "Gabriela Pino", "Técnico de internet", "Rodrigo Saavedra",
      "Fernanda Lagos", "Gasfíter Juan Ortiz", "Isabel Correa", "Cristóbal Vidal", "Delivery supermercado", "Lorena Bustos",
      "Electricista Hugo Mena", "Patricio Leiva", "Abuela Rosa", "Kinesióloga a domicilio"]
    const titulos = ["Visita familiar", "Visita de amigos", "Servicio técnico", "Reparación en casa", "Entrega a domicilio", "Cumpleaños", "Atención de salud"]
    for (const p of periodos) {
      const total = azar.entero(9, 14)
      for (let i = 0; i < total; i++) {
        const dia = fecha(p, azar.entero(1, 28))
        if (dia > hoy) continue
        const casa = azar.entero(1, TOTAL_CASAS)
        const visitante = azar.elegir(visitantes)
        await tx`
          insert into public.visits (condo_id, house_id, visitor_name, visit_title, visit_date, visit_time, visitor_phone, description, created_by, created_at)
          values (${condoId}, ${casaId(casa)}, ${visitante}, ${azar.elegir(titulos)}, ${dia},
            ${`${String(azar.entero(9, 21)).padStart(2, "0")}:${azar.elegir(["00", "15", "30", "45"])}`},
            ${`+56 9 0000 ${String(azar.entero(1000, 9999))}`}, ${azar.siguiente() < 0.5 ? "Llega en auto, usa estacionamiento de visitas" : "Llega a pie"},
            ${vecino(casa)}, ${dia + " 09:00"})`
      }
    }
    for (const [casa, dias, visitante] of [[4, 1, "Hermana Pamela Díaz"], [10, 2, "Técnico de alarma"]] as const) {
      const dia = new Date(Date.parse(hoy) + dias * 86_400_000).toISOString().slice(0, 10)
      await tx`
        insert into public.visits (condo_id, house_id, visitor_name, visit_title, visit_date, visit_time, description, created_by)
        values (${condoId}, ${casaId(casa)}, ${visitante}, 'Visita programada', ${dia}, '17:30', 'Aviso anticipado del residente', ${vecino(casa)})`
    }

    // Encomiendas.
    const remitentes = ["Mercado Libre", "Falabella", "Ripley", "Paris", "Amazon", "Correos de Chile", "Starken", "Chilexpress", "Banco (documentos)", "AliExpress"]
    let seq = 1
    for (const p of periodos) {
      const total = azar.entero(10, 15)
      for (let i = 0; i < total; i++) {
        const dia = fecha(p, azar.entero(1, 28))
        if (dia > hoy) continue
        const casa = azar.entero(1, TOTAL_CASAS)
        const conserje = azar.entero(0, 3)
        const reciente = Date.parse(hoy) - Date.parse(dia) < 3 * 86_400_000
        const remitente = azar.elegir(remitentes)
        const tipo = remitente.includes("documentos") ? "documento" : azar.siguiente() < 0.2 ? "sobre" : "paquete"
        const entregado = reciente ? null : new Date(Date.parse(dia) + azar.entero(2, 30) * 3_600_000).toISOString()
        await tx`
          insert into public.parcels (condo_id, house_id, created_by, created_by_user_id, parcel_type, from_sender, recipient_name,
            tracking_number, received_date, status, delivered_date, received_by, delivered_by, notes, created_at)
          values (${condoId}, ${casaId(casa)}, ${conserjes[conserje]}, ${conserjes[conserje]}, ${tipo}, ${remitente},
            ${`${FAMILIAS[casa - 1][0]} ${FAMILIAS[casa - 1][1]}`}, ${`DEMO-${String(seq++).padStart(5, "0")}`},
            ${dia + " " + String(azar.entero(9, 19)).padStart(2, "0") + ":20"}, ${entregado ? "entregado" : "recibido"}, ${entregado},
            ${`${CONSERJES[conserje][0]} ${CONSERJES[conserje][1]}`}, ${entregado ? `${CONSERJES[(conserje + 1) % 4][0]} ${CONSERJES[(conserje + 1) % 4][1]}` : null},
            ${entregado ? "Entregado al residente" : "En conserjería, avisar al residente"}, ${dia + " 10:00"})`
      }
    }

    // Bitácora de conserjería y solicitudes de materiales.
    const bitacora: [string, string][] = [
      ["security", "Ronda nocturna sin novedades"], ["cleaning", "Limpieza de quincho tras reserva"],
      ["maintenance", "Riego manual de jardín de acceso"], ["delivery", "Recepción de encomiendas del día"],
      ["visit", "Registro de visita con vehículo"], ["security", "Revisión de cámaras y portón"],
      ["cleaning", "Retiro de basura de contenedores"], ["other", "Lectura de medidor de agua general"],
    ]
    for (const p of periodos) {
      for (let d = 2; d <= 28; d += 3) {
        const dia = fecha(p, d)
        if (dia > hoy) continue
        const [tipo, descripcion] = azar.elegir(bitacora)
        await tx`
          insert into public.concierge_worklogs (condo_id, concierge_id, activity_type, activity_description, activity_date, activity_time)
          values (${condoId}, ${conserjes[azar.entero(0, 3)]}, ${tipo}, ${descripcion}, ${dia}, ${`${String(azar.entero(8, 22)).padStart(2, "0")}:00`})`
      }
      const gastoAseo = gastoIds.get(`${p.mes}:Artículos de aseo`)
      await tx`
        insert into public.supply_requests (condo_id, created_by, request_title, request_description, request_category, quantity,
          unit_price, estimated_cost, priority, status, approved_by, approved_at, linked_expense_id, created_at)
        values (${condoId}, ${conserjes[p.mes % 4]}, 'Reposición artículos de aseo', 'Cloro, detergente, bolsas y papel higiénico',
          'cleaning', 1, 58000, 58000, 'normal', ${gastoAseo ? "purchased" : "pending"}, ${gastoAseo ? adminId : null},
          ${gastoAseo ? fecha(p, 9) + " 12:00" : null}, ${gastoAseo ?? null}, ${fecha(p, 7) + " 09:00"})`
    }

    // Alertas (vencidas quedan inactivas).
    const alertas: [string, string, string, string, string][] = [
      ["Corte de agua programado", "Aguas Andinas cortará el suministro el 14 de abril de 09:00 a 15:00 por obras en la red.", "alta", "2026-04-10", "2026-04-15"],
      ["Corte de luz no programado", "Se registró un corte de luz en el sector. La distribuidora informa reposición estimada a las 22:00. El portón queda en modo manual.", "urgente", "2026-07-08", "2026-07-09"],
      ["Fumigación de áreas comunes", "El sábado se realizará control de plagas. Mantenga mascotas dentro de casa entre 10:00 y 13:00.", "media", "2026-07-20", "2026-07-26"],
      ["Corte de luz no programado", "Falla en el empalme del sector norte. Conserjería opera con linterna y radio.", "urgente", "2026-09-05", "2026-09-06"],
      ["Mantención de portón", "El portón vehicular estará en mantención; use el acceso peatonal entre 15:00 y 17:00.", "baja", "2026-10-19", "2026-10-21"],
      ["Arreglo de piscina", "La piscina permanecerá cerrada mientras se cambia la bomba y el filtro. Apertura estimada: 30 de noviembre.", "alta", "2026-11-17", "2026-11-30"],
      ["Corte de agua programado", "El miércoles 26 de noviembre no habrá agua de 10:00 a 14:00 por limpieza de estanques.", "alta", "2026-11-21", "2026-11-27"],
    ]
    for (const [titulo, mensaje, prioridad, creada, vence] of alertas) {
      if (creada > hoy) continue
      await tx`
        insert into public.alerts (condo_id, title, message, priority, is_active, expires_at, created_by, created_at)
        values (${condoId}, ${titulo}, ${mensaje}, ${prioridad}, ${vence >= hoy}, ${vence}, ${adminId}, ${creada + " 08:30"})`
    }

    // Proyectos de mejora con cotizaciones.
    const proyectos: { nombre: string; desc: string; tipo: string; lugar: string; estado: string; estimado: number; real: number | null; inicio: string | null; fin: string | null; creado: string; cotizaciones: [string, number, string, boolean][] }[] = [
      { nombre: "Cámaras de seguridad CCTV", desc: "8 cámaras HD en accesos y pasajes con grabador de 30 días", tipo: "Seguridad", lugar: "Accesos y pasajes", estado: "completado", estimado: 1_200_000, real: 1_150_000, inicio: "2026-05-04", fin: "2026-06-20", creado: "2026-03-20",
        cotizaciones: [["Seguridad Total Ltda.", 1_150_000, "8 cámaras + DVR + instalación", true], ["VigiCam SpA", 1_320_000, "8 cámaras IP + NVR", false], ["Electro Sur", 1_240_000, "8 cámaras analógicas", false]] },
      { nombre: "Recambio de luminarias a LED", desc: "Reemplazo de 24 luminarias de pasajes por LED de bajo consumo", tipo: "Eficiencia energética", lugar: "Pasajes interiores", estado: "completado", estimado: 90_000, real: 85_400, inicio: "2026-06-08", fin: "2026-06-12", creado: "2026-05-15",
        cotizaciones: [["Compra directa ferretería", 85_400, "24 ampolletas LED 12W; instalación por conserjería", true]] },
      { nombre: "Reparación de piscina", desc: "Cambio de bomba y filtro antes de la temporada de verano", tipo: "Mantención mayor", lugar: "Piscina", estado: "en_progreso", estimado: 180_000, real: null, inicio: "2026-10-21", fin: null, creado: "2026-10-05",
        cotizaciones: [["Piscinas del Valle", 180_000, "Bomba 1 HP + filtro de arena", true], ["AquaService", 215_000, "Bomba 1,5 HP + filtro", false]] },
      { nombre: "Renovación de juegos infantiles", desc: "Reemplazo de juegos y piso de caucho en la plaza", tipo: "Áreas verdes", lugar: "Plaza central", estado: "aprobado", estimado: 1_850_000, real: null, inicio: "2027-01-10", fin: null, creado: "2026-08-12",
        cotizaciones: [["Juegos Seguros SpA", 1_850_000, "Módulo multijuego + piso caucho 40 m²", true], ["Plaza Kids", 2_100_000, "Módulo + columpios + piso", false]] },
      { nombre: "Techado de estacionamientos de visitas", desc: "Estructura metálica con policarbonato para 6 estacionamientos", tipo: "Infraestructura", lugar: "Estacionamientos de visitas", estado: "propuesto", estimado: 3_400_000, real: null, inicio: null, fin: null, creado: "2026-10-28",
        cotizaciones: [["Estructuras Andes", 3_400_000, "Policarbonato alveolar 10 mm", false], ["Metalcon Norte", 3_750_000, "Policarbonato compacto", false], ["Techos Express", 3_190_000, "Malla raschel + estructura", false]] },
    ]
    for (const p of proyectos) {
      const [fila] = await tx`
        insert into public.projects (condo_id, name, description, improvement_type, location_description, status, estimated_cost,
          actual_cost, start_date, end_date, created_by, created_at)
        values (${condoId}, ${p.nombre}, ${p.desc}, ${p.tipo}, ${p.lugar}, ${p.estado}, ${p.estimado}, ${p.real}, ${p.inicio},
          ${p.fin}, ${adminId}, ${p.creado + " 11:00"})
        returning id`
      for (const [proveedor, monto, desc, elegida] of p.cotizaciones)
        await tx`insert into public.project_quotes (project_id, vendor_name, amount, description, is_selected) values (${fila.id}, ${proveedor}, ${monto}, ${desc}, ${elegida})`
    }

    // Encuestas: proyectos, actividades y consulta de alza del gasto común.
    const encuestas: { titulo: string; desc: string; creada: string; cierra: string; opciones: [string, number][] }[] = [
      { titulo: "Proyecto: ¿Instalamos cámaras de seguridad CCTV?", desc: "Costo $1.150.000 en 3 cuotas desde el fondo operacional.", creada: "2026-03-25", cierra: "2026-04-15", opciones: [["Sí, en 3 cuotas", 11], ["No por ahora", 3]] },
      { titulo: "Proyecto: renovación de juegos infantiles, ¿qué opción prefieres?", desc: "Ambas cotizaciones incluyen piso de caucho.", creada: "2026-08-14", cierra: "2026-09-10", opciones: [["Juegos Seguros ($1.850.000)", 9], ["Plaza Kids ($2.100.000)", 3], ["Postergar", 2]] },
      { titulo: "Proyecto: ¿Aprobar techado de estacionamientos de visitas?", desc: "Se financiaría con fondo de reserva y cuota extraordinaria. Ver cotizaciones en Proyectos.", creada: "2026-11-02", cierra: "2026-12-10", opciones: [["Sí, con cuota extraordinaria", 5], ["Sí, solo con fondo de reserva", 2], ["No", 2]] },
      { titulo: "Consulta: ¿Subir el gasto común de $180.000 a $195.000 desde enero?", desc: "El alza cubriría el reajuste de sueldos de conserjería y el aumento de la electricidad. Resultado informativo para la asamblea.", creada: "2026-11-10", cierra: "2026-12-05", opciones: [["Sí, a $195.000", 4], ["Sí, pero a $188.000", 3], ["No, mantener $180.000", 3]] },
      { titulo: "Actividad: Día del Niño en la plaza", desc: "Juegos, globos y colación para los niños del condominio.", creada: "2026-07-20", cierra: "2026-08-05", opciones: [["Sábado 8 de agosto", 8], ["Domingo 9 de agosto", 5]] },
      { titulo: "Actividad: ¿Hacemos una once comunitaria por Fiestas Patrias?", desc: "Cada familia aporta un plato; el condominio pone bebidas.", creada: "2026-08-25", cierra: "2026-09-12", opciones: [["Sí, en el quincho", 12], ["No participaré", 2]] },
      { titulo: "Actividad: Fiesta de Navidad", desc: "Elijamos el formato de la celebración de fin de año.", creada: "2026-11-15", cierra: "2026-12-12", opciones: [["Cena en el quincho", 4], ["Once con Viejito Pascuero para los niños", 5], ["No hacer actividad", 1]] },
      { titulo: "Horario de piscina temporada de verano", desc: "Propuesta de horario de uso desde la reapertura.", creada: "2026-11-18", cierra: "2026-12-01", opciones: [["10:00 a 20:00", 3], ["11:00 a 21:00", 4]] },
    ]
    for (const e of encuestas) {
      if (e.creada > hoy) continue
      const [fila] = await tx`
        insert into public.surveys (condo_id, title, description, is_active, created_by, created_at, closes_at)
        values (${condoId}, ${e.titulo}, ${e.desc}, ${e.cierra >= hoy}, ${adminId}, ${e.creada + " 10:00"}, ${e.cierra + " 23:59:00-03"})
        returning id`
      const votantes = [...vecinos]
      for (const [i, [texto, votos]] of e.opciones.entries()) {
        const [op] = await tx`insert into public.survey_options (survey_id, option_text, display_order) values (${fila.id}, ${texto}, ${i + 1}) returning id`
        for (let v = 0; v < votos && votantes.length; v++) {
          const voter = votantes.splice(azar.entero(0, votantes.length - 1), 1)[0]
          await tx`insert into public.survey_votes (survey_id, option_id, voter_id) values (${fila.id}, ${op.id}, ${voter})`
        }
      }
    }
  })

  const conteos = await sql`
    select 'gastos' t, count(*)::int n from public.condo_expenses where condo_id = ${condoId}
    union all select 'ingresos', count(*)::int from public.condo_income where condo_id = ${condoId}
    union all select 'comprobantes', count(*)::int from public.payment_proofs where condo_id = ${condoId}
    union all select 'visitas', count(*)::int from public.visits where condo_id = ${condoId}
    union all select 'encomiendas', count(*)::int from public.parcels where condo_id = ${condoId}
    union all select 'reservas', count(*)::int from public.area_reservations where condo_id = ${condoId}
    union all select 'alertas', count(*)::int from public.alerts where condo_id = ${condoId}
    union all select 'proyectos', count(*)::int from public.projects where condo_id = ${condoId}
    union all select 'encuestas', count(*)::int from public.surveys where condo_id = ${condoId}
    union all select 'bitacora', count(*)::int from public.concierge_worklogs where condo_id = ${condoId}
    union all select 'infracciones', count(*)::int from public.infractions where condo_id = ${condoId}`
  console.log("\nRegistros:", Object.fromEntries(conteos.map((c) => [c.t, c.n])))

  const verificacion = await sql`
    select m.mes,
      (select coalesce(sum(amount), 0) from public.condo_income i where i.condo_id = ${condoId} and i.status = 'approved' and i.period_month = m.mes and i.period_year = 2026)::bigint ingresos,
      (select coalesce(sum(amount), 0) from public.condo_expenses e where e.condo_id = ${condoId} and e.period_month = m.mes and e.period_year = 2026)::bigint egresos
    from unnest(${periodos.map((p: Periodo) => p.mes)}::int[]) m(mes) order by 1`
  const fallas = verificacion.filter((v) => Number(v.ingresos) <= Number(v.egresos))
  console.log("Verificación en BD:", fallas.length ? `FALLA en meses ${fallas.map((f) => f.mes)}` : "ingresos > egresos en todos los meses")
  if (fallas.length) process.exitCode = 1
} finally {
  await sql.end()
}
