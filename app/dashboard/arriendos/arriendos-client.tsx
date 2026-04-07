"use client"

import { useState } from "react"
import { createRental } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Plus, Key, User, Calendar, DollarSign } from "lucide-react"

interface ArriendosClientProps {
  rentals: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function ArriendosClient({ rentals, currencySymbol, isAdmin }: ArriendosClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [photoUrl, setPhotoUrl] = useState("")

  const totalMonthly = rentals.filter((r) => r.is_active).reduce((a, r) => a + Number(r.rental_amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Arriendos</h1>
          <p className="text-sm text-muted-foreground">
            {"Ingreso mensual por arriendos: "}
            <span className="font-semibold text-foreground">{currencySymbol}{totalMonthly.toLocaleString()}</span>
          </p>
        </div>
        {isAdmin && (
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nuevo Arriendo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Registrar Espacio en Arriendo</DialogTitle></DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("photo_url", photoUrl)
                  await createRental(fd)
                  setOpenNew(false)
                  setPhotoUrl("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="space_name">Nombre del Espacio</Label>
                  <Input id="space_name" name="space_name" placeholder="Ej: Local comercial 1" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rental_desc">Descripcion</Label>
                  <Textarea id="rental_desc" name="description" placeholder="Descripcion del espacio..." />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Foto del espacio</Label>
                  <FileUpload bucket="rentals" onUpload={setPhotoUrl} label="Subir foto" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="rental_amount">Monto mensual ({currencySymbol})</Label>
                  <Input id="rental_amount" name="rental_amount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tenant_name">Arrendatario</Label>
                  <Input id="tenant_name" name="tenant_name" placeholder="Nombre del arrendatario" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tenant_contact">Contacto</Label>
                  <Input id="tenant_contact" name="tenant_contact" placeholder="Telefono o email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="start_date">Desde</Label>
                    <Input id="start_date" name="start_date" type="date" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="end_date">Hasta</Label>
                    <Input id="end_date" name="end_date" type="date" />
                  </div>
                </div>
                <Button type="submit">Guardar Arriendo</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rentals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Key className="h-10 w-10" />
            <p>No hay arriendos registrados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rentals.map((rental) => (
            <Card key={rental.id as string} className={!rental.is_active ? "opacity-60" : ""}>
              {rental.photo_url ? (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={rental.photo_url as string}
                    alt={rental.space_name as string}
                    className="h-full w-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : null}
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{rental.space_name as string}</CardTitle>
                  <Badge variant={rental.is_active ? "default" : "secondary"}>
                    {rental.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                {rental.description ? <CardDescription>{rental.description as string}</CardDescription> : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{currencySymbol}{Number(rental.rental_amount).toLocaleString()}/mes</span>
                </div>
                {rental.tenant_name ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{rental.tenant_name as string}</span>
                  </div>
                ) : null}
                {(rental.start_date || rental.end_date) ? (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{(rental.start_date as string) || "?"} - {(rental.end_date as string) || "indefinido"}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
