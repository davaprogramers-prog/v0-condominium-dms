"use client"

import { useActionState } from "react"
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { enviarContacto, type EstadoContacto } from "./acciones"
import type { CampoContacto } from "@/lib/contacto/validacion"

const INICIAL: EstadoContacto = {
  estado: "inicial",
  valores: { nombre: "", celular: "", correo: "", condominio: "", mensaje: "" },
}

const CAMPOS: { id: Exclude<CampoContacto, "mensaje">; label: string; type: string; autoComplete: string; placeholder: string; maxLength: number }[] = [
  { id: "nombre", label: "Nombre", type: "text", autoComplete: "name", placeholder: "Tu nombre", maxLength: 100 },
  { id: "celular", label: "Celular", type: "tel", autoComplete: "tel", placeholder: "+56 9 1234 5678", maxLength: 20 },
  { id: "correo", label: "Correo", type: "email", autoComplete: "email", placeholder: "nombre@correo.cl", maxLength: 254 },
  { id: "condominio", label: "Condominio", type: "text", autoComplete: "organization", placeholder: "Nombre del condominio", maxLength: 150 },
]

export function FormularioContacto() {
  const [estado, accion, enviando] = useActionState(enviarContacto, INICIAL)
  const errores = estado.errores ?? {}

  return (
    <form action={accion} noValidate className="flex flex-col gap-5" key={estado.estado === "exito" ? "limpio" : "datos"}>
      {estado.estado === "exito" && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-green-700/30 bg-green-50 p-4 text-sm text-green-900">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{estado.mensaje}</p>
        </div>
      )}
      {estado.estado === "error" && estado.mensaje && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>{estado.mensaje}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {CAMPOS.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <Label htmlFor={c.id} className="text-[#0d3068]">
              {c.label} <span aria-hidden="true">*</span>
            </Label>
            <Input
              id={c.id}
              name={c.id}
              type={c.type}
              autoComplete={c.autoComplete}
              placeholder={c.placeholder}
              maxLength={c.maxLength}
              required
              defaultValue={estado.valores[c.id]}
              aria-invalid={Boolean(errores[c.id])}
              aria-describedby={errores[c.id] ? `${c.id}-error` : undefined}
              className="border-[#0d3068]/30 bg-white text-[#0d3068]"
            />
            {errores[c.id] && (
              <p id={`${c.id}-error`} className="text-sm text-red-800">
                {errores[c.id]}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="mensaje" className="text-[#0d3068]">
          Mensaje <span aria-hidden="true">*</span>
        </Label>
        <Textarea
          id="mensaje"
          name="mensaje"
          rows={5}
          maxLength={2000}
          required
          placeholder="Cuéntanos cuántas casas o departamentos tiene tu condominio y qué necesitas."
          defaultValue={estado.valores.mensaje}
          aria-invalid={Boolean(errores.mensaje)}
          aria-describedby={errores.mensaje ? "mensaje-error" : undefined}
          className="border-[#0d3068]/30 bg-white text-[#0d3068]"
        />
        {errores.mensaje && (
          <p id="mensaje-error" className="text-sm text-red-800">
            {errores.mensaje}
          </p>
        )}
      </div>

      <Button type="submit" disabled={enviando} size="lg" className="w-full rounded-full bg-[#0d3068] text-[#fefce1] hover:bg-[#0d3068]/90 sm:w-auto sm:self-end">
        {enviando ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
        {enviando ? "Enviando..." : "Solicitar cotización"}
      </Button>
    </form>
  )
}
