"use server"

import { Resend } from "resend"
import { consumirIntento, mensajeEspera } from "@/lib/auth/plataforma/limite"
import { CAMPOS_CONTACTO, validarContacto, type DatosContacto, type ErroresContacto } from "@/lib/contacto/validacion"

const DESTINO = "publicidad@dmsinnova.cl"
const ASUNTO = "Cotización InteliCON"
const REMITENTE = "noreply@administracioncondominio.app"

export type EstadoContacto = {
  estado: "inicial" | "exito" | "error"
  mensaje?: string
  errores?: ErroresContacto
  valores: DatosContacto
}

function escaparHtml(v: string) {
  return v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function htmlCotizacion(d: DatosContacto) {
  const filas: [string, string][] = [
    ["Nombre", d.nombre],
    ["Celular", d.celular],
    ["Correo", d.correo],
    ["Condominio", d.condominio],
  ]
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0d3068;">
    <h2>Cotización InteliCON</h2>
    <table style="border-collapse: collapse; width: 100%;">
      ${filas
        .map(
          ([k, v]) =>
            `<tr><td style="padding: 6px 12px 6px 0; font-weight: bold; vertical-align: top;">${k}:</td><td style="padding: 6px 0;">${escaparHtml(v)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="font-weight: bold; margin: 16px 0 4px;">Mensaje:</p>
    <p style="white-space: pre-wrap; margin: 0;">${escaparHtml(d.mensaje)}</p>
  </div>`
}

function textoCotizacion(d: DatosContacto) {
  return `Cotización InteliCON\n\nNombre: ${d.nombre}\nCelular: ${d.celular}\nCorreo: ${d.correo}\nCondominio: ${d.condominio}\n\nMensaje:\n${d.mensaje}`
}

export async function enviarContacto(_previo: EstadoContacto, formData: FormData): Promise<EstadoContacto> {
  const valores = Object.fromEntries(
    CAMPOS_CONTACTO.map((c) => [c, String(formData.get(c) ?? "").slice(0, 3000)]),
  ) as DatosContacto

  const validacion = validarContacto(valores)
  if (!validacion.ok) {
    return { estado: "error", mensaje: "Revisa los campos marcados.", errores: validacion.errores, valores }
  }
  const datos = validacion.datos

  const espera = await consumirIntento("contacto", datos.correo)
  if (espera > 0) return { estado: "error", mensaje: mensajeEspera(espera), valores }

  const apiKey = process.env.RESENDCONDO_API_KEY
  if (!apiKey) {
    console.error("[contacto] RESENDCONDO_API_KEY no está configurada")
    return { estado: "error", mensaje: "No pudimos enviar tu mensaje. Llámanos al +56 9 59261524.", valores }
  }

  try {
    const envio = await new Resend(apiKey).emails.send({
      from: REMITENTE,
      to: DESTINO,
      reply_to: datos.correo,
      subject: ASUNTO,
      html: htmlCotizacion(datos),
      text: textoCotizacion(datos),
    })
    if (envio.error) {
      console.error("[contacto] Resend rechazó el envío:", envio.error.message)
      return { estado: "error", mensaje: "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.", valores }
    }
  } catch (e) {
    console.error("[contacto] Error al enviar:", (e as Error).message)
    return { estado: "error", mensaje: "No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.", valores }
  }

  return {
    estado: "exito",
    mensaje: "Recibimos tu solicitud. Te contactaremos pronto.",
    valores: { nombre: "", celular: "", correo: "", condominio: "", mensaje: "" },
  }
}
