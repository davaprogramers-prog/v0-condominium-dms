"use client"

import { useState } from "react"
import { createHouse, updateHouse } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Home, Pencil } from "lucide-react"

interface CasasClientProps {
  houses: Record<string, unknown>[]
  isAdmin: boolean
  currencySymbol: string
}

export function CasasClient({ houses, isAdmin, currencySymbol }: CasasClientProps) {
  const [open, setOpen] = useState(false)
  const [editHouse, setEditHouse] = useState<Record<string, unknown> | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Casas</h1>
          <p className="text-sm text-muted-foreground">
            {houses.length} casas registradas
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nueva Casa</Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Registrar Nueva Casa</DialogTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Agrega una nueva propiedad al condominio</p>
              </DialogHeader>
              <form
                action={async (fd) => {
                  await createHouse(fd)
                  setOpen(false)
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="house_number" className="text-slate-900 dark:text-slate-200">Numero de Casa</Label>
                  <Input id="house_number" name="house_number" placeholder="Ej: A-101, Casa 5..." required className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="owner_name" className="text-slate-900 dark:text-slate-200">Nombre del Residente</Label>
                  <Input id="owner_name" name="owner_name" placeholder="Nombre completo" className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="owner_email" className="text-slate-900 dark:text-slate-200">Email del Residente</Label>
                  <Input id="owner_email" name="owner_email" type="email" placeholder="correo@ejemplo.com" className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="payment_deadline_day" className="text-slate-900 dark:text-slate-200">Día de vencimiento de pago</Label>
                  <Input id="payment_deadline_day" name="payment_deadline_day" type="number" min={1} max={28} placeholder="5" defaultValue={5} className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
                  <p className="text-xs text-slate-600 dark:text-slate-400">Día del mes para vencimiento (1-28)</p>
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Casa</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {editHouse && (
        <Dialog open={!!editHouse} onOpenChange={() => setEditHouse(null)}>
          <DialogContent className="bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-900 dark:text-white">Editar Casa #{editHouse.house_number as string}</DialogTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Actualiza los datos del residente (no puedes cambiar el número de casa)</p>
            </DialogHeader>
            <form
              action={async (fd) => {
                fd.set("id", editHouse.id as string)
                await updateHouse(fd)
                setEditHouse(null)
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_owner_name" className="text-slate-900 dark:text-slate-200">Nombre del Residente</Label>
                <Input id="edit_owner_name" name="owner_name" defaultValue={(editHouse.owner_name as string) || ""} className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_owner_email" className="text-slate-900 dark:text-slate-200">Email del Residente</Label>
                <Input id="edit_owner_email" name="owner_email" type="email" defaultValue={(editHouse.owner_email as string) || ""} className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit_due_day" className="text-slate-900 dark:text-slate-200">Día de vencimiento</Label>
                <Input id="edit_due_day" name="payment_deadline_day" type="number" min={1} max={28} defaultValue={(editHouse.payment_deadline_day as number) || 5} className="border-slate-300 dark:border-slate-600 focus:border-slate-500 focus:ring-slate-500 dark:bg-slate-800 dark:text-white" />
                <p className="text-xs text-slate-600 dark:text-slate-400">Día del mes para vencimiento (1-28)</p>
              </div>
              <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Cambios</Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de Casas</CardTitle>
          <CardDescription>{houses.length} unidades en total</CardDescription>
        </CardHeader>
        <CardContent>
          {houses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Home className="h-10 w-10" />
              <p>No hay casas registradas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {houses.map((house, index) => {
                const colors = [
                  { bg: "from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30", border: "border-blue-400", title: "text-blue-900 dark:text-blue-200", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200" },
                  { bg: "from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30", border: "border-purple-400", title: "text-purple-900 dark:text-purple-200", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200" },
                  { bg: "from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30", border: "border-green-400", title: "text-green-900 dark:text-green-200", text: "text-green-700 dark:text-green-300", badge: "bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-200" },
                  { bg: "from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30", border: "border-orange-400", title: "text-orange-900 dark:text-orange-200", text: "text-orange-700 dark:text-orange-300", badge: "bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-200" },
                  { bg: "from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/30", border: "border-cyan-400", title: "text-cyan-900 dark:text-cyan-200", text: "text-cyan-700 dark:text-cyan-300", badge: "bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-200" },
                  { bg: "from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30", border: "border-pink-400", title: "text-pink-900 dark:text-pink-200", text: "text-pink-700 dark:text-pink-300", badge: "bg-pink-200 dark:bg-pink-900 text-pink-900 dark:text-pink-200" },
                ]
                const color = colors[index % colors.length]
                
                return (
                  <div key={house.id as string} className={`rounded-lg border-2 bg-gradient-to-br ${color.bg} ${color.border} p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex flex-col gap-4">
                      {/* Header with number and status */}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`text-sm font-semibold ${color.text}`}>Casa</p>
                          <h3 className={`text-2xl font-bold ${color.title}`}>#{house.house_number as string}</h3>
                        </div>
                        <Badge className={`${color.badge} border-0`}>
                          {house.is_active !== false ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>

                      {/* Owner information */}
                      <div>
                        <p className={`text-xs font-medium uppercase ${color.text}`}>Residente</p>
                        <p className={`font-semibold ${color.title}`}>{(house.owner_name as string) || "-"}</p>
                      </div>

                      {/* Email */}
                      <div>
                        <p className={`text-xs font-medium uppercase ${color.text}`}>Email</p>
                        <p className={`text-sm truncate ${color.title}`}>{(house.owner_email as string) || "-"}</p>
                      </div>

                      {/* Payment deadline */}
                      <div>
                        <p className={`text-xs font-medium uppercase ${color.text}`}>Vencimiento</p>
                        <p className={`font-semibold ${color.title}`}>Día {house.payment_deadline_day as number || 5}</p>
                      </div>

                      {/* Actions */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setEditHouse(house)}
                          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${color.badge} hover:opacity-80 transition-opacity`}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
