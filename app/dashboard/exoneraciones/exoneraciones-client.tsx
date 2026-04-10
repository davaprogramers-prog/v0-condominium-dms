"use client"

import { useState } from "react"
import { createExemption, createExemptionType, updateExemption, updateExemptionType, deleteExemption, deleteExemptionType } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, ShieldOff, Edit2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface ExoneracionesClientProps {
  exemptions: Record<string, unknown>[]
  exemptionTypes: Record<string, unknown>[]
  houses: Record<string, unknown>[]
  isAdmin: boolean
}

export function ExoneracionesClient({ exemptions, exemptionTypes, houses, isAdmin }: ExoneracionesClientProps) {
  const router = useRouter()
  const [openExemption, setOpenExemption] = useState(false)
  const [openType, setOpenType] = useState(false)
  const [selectedHouse, setSelectedHouse] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [isPermanent, setIsPermanent] = useState(false)
  const [editingExemption, setEditingExemption] = useState<string | null>(null)
  const [editingType, setEditingType] = useState<string | null>(null)
  const [deletingExemption, setDeletingExemption] = useState<string | null>(null)
  const [deletingType, setDeletingType] = useState<string | null>(null)

  const handleDeleteExemption = async (id: string) => {
    setDeletingExemption(id)
    try {
      await deleteExemption(id)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting exemption:", error)
    } finally {
      setDeletingExemption(null)
    }
  }

  const handleDeleteType = async (id: string) => {
    setDeletingType(id)
    try {
      await deleteExemptionType(id)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting exemption type:", error)
    } finally {
      setDeletingType(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exoneraciones</h1>
          <p className="text-sm text-muted-foreground">{exemptions.length} exoneraciones registradas</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Dialog open={openType} onOpenChange={setOpenType}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-2 h-4 w-4" />Tipo</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Nuevo Tipo de Exoneracion</DialogTitle></DialogHeader>
                <form action={async (fd) => { await createExemptionType(fd); setOpenType(false) }} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type_name" className="text-slate-900 dark:text-slate-200">Nombre</Label>
                    <Input id="type_name" name="name" placeholder="Ej: Servicio de vigilancia" required className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="type_desc" className="text-slate-900 dark:text-slate-200">Descripcion</Label>
                    <Textarea id="type_desc" name="description" placeholder="Descripcion del tipo..." className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Tipo</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={openExemption} onOpenChange={setOpenExemption}>
              <DialogTrigger asChild>
                <Button className="bg-slate-700 hover:bg-slate-800 text-white"><Plus className="mr-2 h-4 w-4" />Nueva Exoneracion</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
                <DialogHeader><DialogTitle className="text-slate-900 dark:text-white">Crear Exoneracion</DialogTitle></DialogHeader>
                <form
                  action={async (fd) => {
                    fd.set("house_id", selectedHouse)
                    fd.set("exemption_type_id", selectedType)
                    fd.set("is_permanent", isPermanent.toString())
                    await createExemption(fd)
                    setOpenExemption(false)
                    setSelectedHouse("")
                    setSelectedType("")
                    setIsPermanent(false)
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label className="text-slate-900 dark:text-slate-200">Casa</Label>
                    <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                      <SelectTrigger className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><SelectValue placeholder="Seleccionar casa" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800">
                        {houses.map((h) => (
                          <SelectItem key={h.id as string} value={h.id as string}>
                            {h.house_number as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-slate-900 dark:text-slate-200">Tipo de Exoneracion</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-800">
                        {exemptionTypes.map((t) => (
                          <SelectItem key={t.id as string} value={t.id as string}>
                            {t.name as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="percentage" className="text-slate-900 dark:text-slate-200">Porcentaje de exoneracion (%)</Label>
                    <Input id="percentage" name="percentage" type="number" min={1} max={100} defaultValue={100} className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch id="is_permanent" checked={isPermanent} onCheckedChange={setIsPermanent} />
                    <Label htmlFor="is_permanent" className="text-slate-900 dark:text-slate-200">Exoneracion permanente</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="start_date" className="text-slate-900 dark:text-slate-200">Desde</Label>
                      <Input id="start_date" name="start_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                    </div>
                    {!isPermanent && (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="end_date" className="text-slate-900 dark:text-slate-200">Hasta</Label>
                        <Input id="end_date" name="end_date" type="date" className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="reason" className="text-slate-900 dark:text-slate-200">Razon</Label>
                    <Textarea id="reason" name="reason" placeholder="Razon de la exoneracion..." className="border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  </div>
                  <Button type="submit" disabled={!selectedHouse || !selectedType} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Exoneracion</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs defaultValue="exemptions">
        <TabsList>
          <TabsTrigger value="exemptions">Exoneraciones ({exemptions.length})</TabsTrigger>
          <TabsTrigger value="types">Tipos ({exemptionTypes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="exemptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Exoneraciones Activas</CardTitle>
              <CardDescription>Casas con exoneracion de gasto comun</CardDescription>
            </CardHeader>
            <CardContent>
              {exemptions.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <ShieldOff className="h-10 w-10" />
                  <p>No hay exoneraciones registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Casa</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Porcentaje</TableHead>
                        <TableHead>Desde</TableHead>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Razon</TableHead>
                        {isAdmin && <TableHead>Acciones</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exemptions.map((ex) => {
                        const isActive = ex.is_permanent || !ex.end_date || new Date(ex.end_date as string) >= new Date()
                        return (
                          <TableRow key={ex.id as string}>
                            <TableCell className="font-medium">
                              {(ex.houses as Record<string, unknown>)?.house_number as string || "?"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {(ex.exemption_types as Record<string, unknown>)?.name as string || "Sin tipo"}
                              </Badge>
                            </TableCell>
                            <TableCell>{ex.percentage as number || 100}%</TableCell>
                            <TableCell className="text-sm">{ex.start_date as string}</TableCell>
                            <TableCell className="text-sm">{ex.is_permanent ? "Permanente" : (ex.end_date as string || "-")}</TableCell>
                            <TableCell>
                              <Badge variant={isActive ? "default" : "secondary"}>
                                {isActive ? "Activa" : "Expirada"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {(ex.reason as string) || "-"}
                            </TableCell>
                            {isAdmin && (
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteExemption(ex.id as string)}
                                    disabled={deletingExemption === ex.id}
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipos de Exoneracion</CardTitle>
            </CardHeader>
            <CardContent>
              {exemptionTypes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No hay tipos definidos</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {exemptionTypes.map((t) => (
                    <div key={t.id as string} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{t.name as string}</p>
                        {t.description ? <p className="text-xs text-muted-foreground">{t.description as string}</p> : null}
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteType(t.id as string)}
                            disabled={deletingType === t.id}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
