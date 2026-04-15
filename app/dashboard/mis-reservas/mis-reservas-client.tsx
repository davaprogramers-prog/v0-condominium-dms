"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, Clock, MapPin, Plus, Edit2, Trash2, AlertTriangle, Home, Check, X, Ban } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"
import { createReservation, updateReservation, cancelReservation, changeReservationHouse, getAvailableSlots, confirmReservation, rejectReservation } from "./actions"

interface Area {
  id: string
  name: string
  photo_url?: string
  max_hours_per_reservation: number
  min_hours_to_modify: number
  reception_time_minutes: number
  delivery_time_minutes: number
  opening_time: string
  closing_time: string
}

interface Reservation {
  id: string
  area_id: string
  house_id: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  common_areas: {
    name: string
    photo_url?: string
    max_hours_per_reservation: number
    min_hours_to_modify: number
    reception_time_minutes: number
    delivery_time_minutes: number
    opening_time: string
    closing_time: string
  }
  houses: {
    house_number: string
  }
}

interface MisReservasClientProps {
  areas: Area[]
  reservations: Reservation[]
  house: { id: string; house_number: string } | null
  houseId: string | null
  condoId: string
  isAdminOrConcierge: boolean
  allHouses: { id: string; house_number: string }[]
}

export function MisReservasClient({
  areas,
  reservations,
  house,
  houseId,
  condoId,
  isAdminOrConcierge,
  allHouses
}: MisReservasClientProps) {
  const [openNew, setOpenNew] = useState(false)
  const [openEdit, setOpenEdit] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [existingSlots, setExistingSlots] = useState<any[]>([])
  const [areaConfig, setAreaConfig] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("10:00")
  const { cardBgColor, cardTextColor, dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  // Generate time options in 30-minute intervals
  const generateTimeOptions = (openTime?: string, closeTime?: string) => {
    const options: string[] = []
    const [openH, openM] = (openTime || "00:00").split(":").map(Number)
    let [closeH, closeM] = (closeTime || "24:00").split(":").map(Number)
    if (closeH === 0 && closeM === 0) closeH = 24 // Handle midnight
    
    const startMin = openH * 60 + openM
    const endMin = closeH * 60 + closeM
    
    for (let min = startMin; min <= endMin; min += 30) {
      const h = Math.floor(min / 60)
      const m = min % 60
      if (h < 24) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
      }
    }
    return options
  }

  const handleAreaChange = async (areaId: string) => {
    setSelectedArea(areaId)
    if (areaId && selectedDate) {
      const result = await getAvailableSlots(areaId, selectedDate)
      setExistingSlots(result.slots)
      setAreaConfig(result.area)
      // Set default times based on area config
      if (result.area) {
        setStartTime(result.area.opening_time || "08:00")
        const openHour = parseInt((result.area.opening_time || "08:00").split(":")[0])
        const maxHours = result.area.max_hours || 2
        setEndTime(`${String(openHour + maxHours).padStart(2, "0")}:00`)
      }
    }
  }

  const handleDateChange = async (date: string) => {
    setSelectedDate(date)
    if (selectedArea && date) {
      const result = await getAvailableSlots(selectedArea, date)
      setExistingSlots(result.slots)
      setAreaConfig(result.area)
    }
  }

  const handleCreateReservation = async (formData: FormData) => {
    if (!houseId && !isAdminOrConcierge) {
      alert("No tienes una propiedad asignada")
      return
    }

    setLoading(true)
    try {
      const targetHouseId = isAdminOrConcierge 
        ? (formData.get("house_id") as string) || houseId
        : houseId

      if (!targetHouseId) {
        alert("Selecciona una propiedad")
        setLoading(false)
        return
      }

      await createReservation({
        area_id: formData.get("area_id") as string,
        house_id: targetHouseId,
        condo_id: condoId,
        reservation_date: formData.get("reservation_date") as string,
        start_time: formData.get("start_time") as string,
        end_time: formData.get("end_time") as string,
        notes: formData.get("notes") as string || undefined,
      })
    setOpenNew(false)
    setSelectedArea("")
    setSelectedDate("")
    setExistingSlots([])
    setErrorMessage(null)
    } catch (error: any) {
    setErrorMessage(error.message || "Error al crear la reserva")
    } finally {
    setLoading(false)
    }
  }

  const handleUpdateReservation = async (formData: FormData, reservationId: string) => {
    setLoading(true)
    try {
      await updateReservation({
        reservation_id: reservationId,
        start_time: formData.get("start_time") as string,
        end_time: formData.get("end_time") as string,
        notes: formData.get("notes") as string || undefined,
      }, isAdminOrConcierge)
      setOpenEdit(null)
    } catch (error: any) {
      alert(error.message || "Error al actualizar la reserva")
    } finally {
      setLoading(false)
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    setLoading(true)
    try {
      await cancelReservation(reservationId, isAdminOrConcierge)
    } catch (error: any) {
      alert(error.message || "Error al cancelar la reserva")
    } finally {
      setLoading(false)
    }
  }

  const handleChangeHouse = async (reservationId: string, newHouseId: string) => {
    setLoading(true)
    try {
      await changeReservationHouse(reservationId, newHouseId)
    } catch (error: any) {
      alert(error.message || "Error al cambiar la propiedad")
    } finally {
      setLoading(false)
    }
  }

  const canModify = (reservation: Reservation) => {
    if (isAdminOrConcierge) return true
    const now = new Date()
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`)
    const hoursUntil = (reservationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntil >= (reservation.common_areas?.min_hours_to_modify || 12)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5)
  }

  const minDate = new Date().toISOString().split("T")[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
  <h1 className="text-2xl font-bold">Mis Reservas</h1>
  <p className="text-sm text-muted-foreground">
  {`Reservas de Casa #${house?.house_number || "N/A"}`}
  </p>
        </div>
        
        {areas.length > 0 && (houseId || isAdminOrConcierge) && (
          <Dialog open={openNew} onOpenChange={(open) => { 
              setOpenNew(open); 
              if (open) { 
                setErrorMessage(null); 
                setStartTime("08:00"); 
                setEndTime("10:00"); 
              } 
            }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Nueva Reserva</DialogTitle>
              </DialogHeader>
              <form action={handleCreateReservation} className="flex flex-col gap-4">
                {isAdminOrConcierge ? (
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Propiedad</Label>
                    <Select name="house_id" defaultValue={houseId || ""}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        <SelectValue placeholder="Selecciona propiedad" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        {allHouses.map(h => (
                          <SelectItem key={h.id} value={h.id}>Casa #{h.house_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <input type="hidden" name="house_id" value={houseId || ""} />
                    {house && (
                      <div className="flex flex-col gap-1">
                        <Label style={{ color: dialogTextColor }}>Propiedad</Label>
                        <div className="p-2 rounded-lg text-sm font-medium" style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                          Casa #{house.house_number}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Área Común</Label>
                  <Select name="area_id" value={selectedArea} onValueChange={handleAreaChange}>
                    <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                      <SelectValue placeholder="Selecciona área" />
                    </SelectTrigger>
                    <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Fecha</Label>
                  <Input
                    type="date"
                    name="reservation_date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                  />
                </div>

                {areaConfig && (
                  <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: inputBgColor }}>
                    <p style={{ color: dialogTextColor }}>
                      <strong>Horario:</strong> {areaConfig.opening_time} - {areaConfig.closing_time}
                    </p>
                    <p style={{ color: dialogTextColor }}>
                      <strong>Máximo:</strong> {areaConfig.max_hours} horas por reserva
                    </p>
                    <p style={{ color: dialogTextColor, opacity: 0.7, fontSize: "12px" }}>
                      Recepción: {areaConfig.reception_minutes} min antes | Entrega: {areaConfig.delivery_minutes} min después
                    </p>
                  </div>
                )}

                {existingSlots.length > 0 && (
                  <div className="p-3 rounded-lg border" style={{ borderColor: inputTextColor }}>
                    <p className="text-sm font-medium mb-2" style={{ color: dialogTextColor }}>Reservas existentes:</p>
                    <div className="flex flex-col gap-1">
                      {existingSlots.map((slot: any) => (
                        <div key={slot.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)", color: dialogTextColor }}>
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)} (Casa #{slot.houses?.house_number})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Hora Inicio</Label>
                    <input type="hidden" name="start_time" value={startTime} />
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        {generateTimeOptions(areaConfig?.opening_time, areaConfig?.closing_time).map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label style={{ color: dialogTextColor }}>Hora Fin</Label>
                    <input type="hidden" name="end_time" value={endTime} />
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        <SelectValue placeholder="Selecciona hora" />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                        {generateTimeOptions(areaConfig?.opening_time, areaConfig?.closing_time).map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Notas (opcional)</Label>
                  <Textarea
                    name="notes"
                    placeholder="Información adicional..."
                    style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg border border-red-400" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1">
                        {errorMessage.split('\n').map((line, i) => (
                          <p key={i} className={`text-sm ${i === 0 ? 'font-semibold text-red-600' : 'text-red-500'}`}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-red-500 hover:text-red-700"
                      onClick={() => setErrorMessage(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                )}

                <Button type="submit" disabled={loading || !selectedArea || !selectedDate} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? "Creando..." : "Crear Reserva"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {areas.length === 0 ? (
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No hay áreas reservables</p>
            <p className="text-sm opacity-70">El administrador aún no ha configurado áreas comunes para reservas</p>
          </CardContent>
        </Card>
      ) : reservations.length === 0 ? (
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No tienes reservas activas</p>
            <p className="text-sm opacity-70">Crea una nueva reserva para usar las áreas comunes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {reservations.filter(r => r.status === "confirmed").map((reservation) => (
            <Card key={reservation.id} style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {reservation.common_areas?.photo_url && (
                      <img
                        src={reservation.common_areas.photo_url}
                        alt={reservation.common_areas.name}
                        className="w-20 h-20 rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-lg">{reservation.common_areas?.name}</h3>
                      <div className="flex items-center gap-2 text-sm opacity-80 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(reservation.reservation_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-80">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</span>
                      </div>
                      {isAdminOrConcierge && (
                        <div className="flex items-center gap-2 text-sm opacity-80">
                          <Home className="h-4 w-4" />
                          <span>Casa #{reservation.houses?.house_number}</span>
                        </div>
                      )}
                      {reservation.notes && (
                        <p className="text-sm mt-2 opacity-70">{reservation.notes}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Status Badge */}
                    <Badge 
                      variant="default" 
                      className={
                        reservation.status === "confirmed" ? "bg-green-600" :
                        reservation.status === "pending" ? "bg-yellow-500 text-black" :
                        reservation.status === "rejected" ? "bg-red-600" : "bg-gray-500"
                      }
                    >
                      {reservation.status === "confirmed" ? "Confirmada" :
                       reservation.status === "pending" ? "Pendiente" :
                       reservation.status === "rejected" ? "Rechazada" : reservation.status}
                    </Badge>
                    
                    {/* Admin/Conserje Actions for Pending/Confirmed Reservations */}
                    {isAdminOrConcierge && (reservation.status === "pending" || reservation.status === "confirmed") && (
                      <div className="flex gap-1">
                        {reservation.status === "pending" && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={async () => {
                              try {
                                await confirmReservation(reservation.id)
                              } catch (error: any) {
                                alert(error.message)
                              }
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Ban className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle style={{ color: dialogTextColor }}>Rechazar Reserva</AlertDialogTitle>
                              <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                                Indica la razón por la cual se rechaza esta reserva. El propietario verá este mensaje.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <form 
                              onSubmit={async (e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const reason = formData.get("reason") as string
                                try {
                                  await rejectReservation(reservation.id, reason)
                                } catch (error: any) {
                                  alert(error.message)
                                }
                              }}
                              className="flex flex-col gap-3"
                            >
                              <Textarea 
                                name="reason" 
                                placeholder="Ej: Mantenimiento programado, daño en el área, etc."
                                required
                                style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                              />
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                                <Button type="submit" variant="destructive">
                                  Rechazar Reserva
                                </Button>
                              </div>
                            </form>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {canModify(reservation) && reservation.status !== "rejected" && (
                        <>
                          <Dialog open={openEdit === reservation.id} onOpenChange={(open) => !open && setOpenEdit(null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setOpenEdit(reservation.id)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                              <DialogHeader>
                                <DialogTitle style={{ color: dialogTextColor }}>Editar Reserva</DialogTitle>
                              </DialogHeader>
                              <form action={(fd) => handleUpdateReservation(fd, reservation.id)} className="flex flex-col gap-4">
                                <div className="p-3 rounded-lg" style={{ backgroundColor: inputBgColor }}>
                                  <p style={{ color: dialogTextColor }}><strong>{reservation.common_areas?.name}</strong></p>
                                  <p className="text-sm" style={{ color: dialogTextColor }}>{formatDate(reservation.reservation_date)}</p>
                                </div>

                                {isAdminOrConcierge && (
                                  <div className="flex flex-col gap-2">
                                    <Label style={{ color: dialogTextColor }}>Cambiar Propiedad</Label>
                                    <Select defaultValue={reservation.house_id} onValueChange={(value) => handleChangeHouse(reservation.id, value)}>
                                      <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                                        {allHouses.map(h => (
                                          <SelectItem key={h.id} value={h.id}>Casa #{h.house_number}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex flex-col gap-2">
                                    <Label style={{ color: dialogTextColor }}>Hora Inicio</Label>
                                    <Input
                                      type="time"
                                      name="start_time"
                                      defaultValue={reservation.start_time.substring(0, 5)}
                                      style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                                    />
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Label style={{ color: dialogTextColor }}>Hora Fin</Label>
                                    <Input
                                      type="time"
                                      name="end_time"
                                      defaultValue={reservation.end_time.substring(0, 5)}
                                      style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <Label style={{ color: dialogTextColor }}>Notas</Label>
                                  <Textarea
                                    name="notes"
                                    defaultValue={reservation.notes || ""}
                                    style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                                  />
                                </div>

                                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                  {loading ? "Guardando..." : "Guardar Cambios"}
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                              <AlertDialogHeader>
                                <AlertDialogTitle style={{ color: dialogTextColor }}>Cancelar Reserva</AlertDialogTitle>
                                <AlertDialogDescription style={{ color: dialogTextColor, opacity: 0.7 }}>
                                  ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>Volver</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleCancelReservation(reservation.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Cancelar Reserva
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>

                    {reservation.status === "rejected" ? (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <Ban className="h-3 w-3" />
                        Reserva no permitida
                      </p>
                    ) : !canModify(reservation) && (
                      <p className="text-xs opacity-60 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Menos de {reservation.common_areas?.min_hours_to_modify || 12}h
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
