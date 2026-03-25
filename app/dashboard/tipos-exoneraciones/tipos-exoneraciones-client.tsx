"use client"

import { useState } from "react"
import { createExemptionType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ShieldOff } from "lucide-react"

interface TiposExoneracionesClientProps {
  exemptionTypes: Record<string, unknown>[]
  isAdmin: boolean
}

export function TiposExoneracionesClient({ exemptionTypes, isAdmin }: TiposExoneracionesClientProps) {
  const [openNew, setOpenNew] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Exoneraciones</h1>
          <p className="text-sm text-muted-foreground">{exemptionTypes.length} tipos registrados</p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Tipo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Tipo de Exoneracion</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  await createExemptionType(fd)
                  setOpenNew(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej: Desempleo, Adulto Mayor, Persona con Discapacidad..."
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Criterios y detalles de esta exoneracion..."
                  />
                </div>
                <Button type="submit">Guardar Tipo</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {exemptionTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <ShieldOff className="h-10 w-10" />
            <p>No hay tipos de exoneraciones registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exemptionTypes.map((type) => (
            <Card key={type.id as string}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldOff className="h-5 w-5" />
                  {type.name as string}
                </CardTitle>
                {type.description && <CardDescription>{type.description as string}</CardDescription>}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
