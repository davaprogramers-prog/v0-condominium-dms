import { z } from "zod"

export const CAMPOS_CONTACTO = ["nombre", "celular", "correo", "condominio", "mensaje"] as const
export type CampoContacto = (typeof CAMPOS_CONTACTO)[number]
export type DatosContacto = Record<CampoContacto, string>
export type ErroresContacto = Partial<Record<CampoContacto, string>>

const texto = (campo: string, max: number, min = 2) =>
  z
    .string()
    .trim()
    .min(min, `Ingresa ${campo}.`)
    .max(max, `Máximo ${max} caracteres.`)

export const esquemaContacto = z.object({
  nombre: texto("tu nombre", 100),
  celular: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{8,20}$/, "Ingresa un celular válido, por ejemplo +56 9 1234 5678.")
    .refine((v) => v.replace(/\D/g, "").length >= 8 && v.replace(/\D/g, "").length <= 15, "Ingresa un celular válido."),
  correo: z.string().trim().toLowerCase().max(254, "Correo demasiado largo.").email("Ingresa un correo válido."),
  condominio: texto("el nombre del condominio", 150),
  mensaje: texto("un mensaje", 2000, 10),
})

export function validarContacto(datos: DatosContacto) {
  const r = esquemaContacto.safeParse(datos)
  if (r.success) return { ok: true as const, datos: r.data }
  const errores: ErroresContacto = {}
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as CampoContacto
    if (!errores[campo]) errores[campo] = issue.message
  }
  return { ok: false as const, errores }
}
