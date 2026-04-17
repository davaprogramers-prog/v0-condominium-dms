"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar, Clock, MapPin, Edit2, Trash2, Check, Ban, Home, Search, Filter } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"
import { updateReservation, cancelReservation, confirmReservation, rejectReservation, changeReservationHouse } from "../mis-reservas/actions"

interface GestionReservasClientProps {
  areas: any[]
  reservations: any[]
  allHouses: { id: string; house_number: string }[]
  condoId: string
}

export function GestionReservasClient({ areas, reservations, allHouses, condoId }: GestionReservasClientProps) {
  const [openEdit, setOpenEdit] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterHouse, setFilterHouse] = useState<string>("all")
  const [searchDate, setSearchDate] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const { cardBgColor, cardTextColor, dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timeStr: string) => timeStr?.substring(0, 5) || ""

  // Filter reservations
  const filteredReservations = reservations.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (filterArea !== "all" && r.area_id !== filterArea) return false
    if (filterHouse !== "all" && r.house_id !== filterHouse) return false
    if (searchDate && r.reservation_date !== searchDate) return false
    return true
  })

  const handleConfirm = async (reservationId: string) => {
    setLoading(true)
    try {
      await confirmReservation(reservationId)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (reservationId: string, reason: string) => {
    setLoading(true)
    try {
      await rejectReservation(reservationId, reason)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (reservationId: string) => {
    setLoading(true)
    try {
      await cancelReservation(reservationId, true)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (formData: FormData, reservationId: string) => {
    setLoading(true)
    try {
      const newHouseId = formData.get("house_id") as string
      const originalReservation = reservations.find(r => r.id === reservationId)

      // If house changed, update it separately
      if (newHouseId && newHouseId !== originalReservation?.house_id) {
        await changeReservationHouse(reservationId, newHouseId)
      }

      await updateReservation({
        reservation_id: reservationId,
        start_time: formData.get("start_time") as string,
        end_time: formData.get("end_time") as string,
        notes: formData.get("notes") as string,
      }, true)
      setOpenEdit(null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-600">Confirmada</Badge>
      case "pending":
        return <Badge className="bg-yellow-500 text-black">Pendiente</Badge>
      case "rejected":
        return <Badge className="bg-red-600">Rechazada</Badge>
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-black">
          Administrar todas las reservas del condominio
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 w-full" style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
        <CardContent className="pt-6 px-6">
          <div className="flex items-center gap-4 mb-8">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="confirmed">Confirmadas</SelectItem>
                  <SelectItem value="rejected">Rechazadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Área Común</Label>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                  <SelectItem value="all">Todas</SelectItem>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Propiedad</Label>
              <Select value={filterHouse} onValueChange={setFilterHouse}>
                <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                  <SelectItem value="all">Todas</SelectItem>
                  {allHouses.map(h => (
                    <SelectItem key={h.id} value={h.id}>Casa #{h.house_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-xs font-semibold">Fecha</Label>
              <Input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                style={{ backgroundColor: inputBgColor, color: inputTextColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{reservations.filter(r => r.status === "pending").length}</div>
            <div className="text-xs opacity-70">Pendientes</div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-500">{reservations.filter(r => r.status === "confirmed").length}</div>
            <div className="text-xs opacity-70">Confirmadas</div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-red-500">{reservations.filter(r => r.status === "rejected").length}</div>
            <div className="text-xs opacity-70">Rechazadas</div>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-gray-500">{reservations.filter(r => r.status === "cancelled").length}</div>
            <div className="text-xs opacity-70">Canceladas</div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <Card style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto opacity-30 mb-4" />
              <p className="font-medium">No hay reservas que coincidan con los filtros</p>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id} style={{ backgroundColor: cardBgColor, color: cardTextColor }}>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{reservation.common_areas?.name}</h3>
                      {getStatusBadge(reservation.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm opacity-80">
                      <span className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        Casa #{reservation.houses?.house_number}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(reservation.reservation_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                      </span>
                    </div>
                    {reservation.profiles?.full_name && (
                      <p className="text-xs opacity-60 mt-1">
                        Creada por: {reservation.profiles.full_name}
                      </p>
                    )}
                    {reservation.notes && (
                      <p className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: inputBgColor }}>
                        {reservation.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Confirm button for pending */}
                    {reservation.status === "pending" && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleConfirm(reservation.id)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                    )}

                    {/* Reject button for pending or confirmed */}
                    {(reservation.status === "pending" || reservation.status === "confirmed") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={loading}>
                            <Ban className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Rechazar Reserva</AlertDialogTitle>
                            <AlertDialogDescription className="opacity-70">
                              Indica la razón del rechazo. El propietario de Casa #{reservation.houses?.house_number} verá este mensaje.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              const formData = new FormData(e.currentTarget)
                              handleReject(reservation.id, formData.get("reason") as string)
                            }}
                            className="flex flex-col gap-3"
                          >
                            <Textarea
                              name="reason"
                              placeholder="Ej: Mantenimiento programado, daño en el área, evento privado, etc."
                              required
                              style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                            />
                            <div className="flex gap-3 justify-end">
                              <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                              <Button type="submit" variant="destructive" disabled={loading}>
                                Rechazar Reserva
                              </Button>
                            </div>
                          </form>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* Edit button */}
                    {reservation.status !== "cancelled" && reservation.status !== "rejected" && (
                      <Dialog open={openEdit === reservation.id} onOpenChange={(open) => !open && setOpenEdit(null)}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setOpenEdit(reservation.id)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                          <DialogHeader>
                            <DialogTitle>Editar Reserva</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => { e.preventDefault(); handleUpdate(new FormData(e.currentTarget), reservation.id) }} className="flex flex-col gap-4">
                            <div className="p-3 rounded-lg" style={{ backgroundColor: inputBgColor }}>
                              <p className="font-semibold">{reservation.common_areas?.name}</p>
                              <p className="text-sm opacity-70">{formatDate(reservation.reservation_date)}</p>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label>Propiedad</Label>
                              <Select name="house_id" defaultValue={reservation.house_id}>
                                <SelectTrigger style={{ backgroundColor: inputBgColor, color: inputTextColor }}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent style={{ backgroundColor: inputBgColor, color: inputTextColor, borderColor: inputTextColor }}>
                                  {allHouses.map(h => (
                                    <SelectItem key={h.id} value={h.id}>Casa #{h.house_number}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col gap-2">
                                <Label>Hora Inicio</Label>
                                <Input
                                  type="time"
                                  name="start_time"
                                  defaultValue={formatTime(reservation.start_time)}
                                  style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Label>Hora Fin</Label>
                                <Input
                                  type="time"
                                  name="end_time"
                                  defaultValue={formatTime(reservation.end_time)}
                                  style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Label>Notas</Label>
                              <Textarea
                                name="notes"
                                defaultValue={reservation.notes || ""}
                                style={{ backgroundColor: inputBgColor, color: inputTextColor }}
                              />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                              Guardar Cambios
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* Cancel button */}
                    {reservation.status !== "cancelled" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor }}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancelar Reserva</AlertDialogTitle>
                            <AlertDialogDescription className="opacity-70">
                              Esta acción cancelar�� la reserva de Casa #{reservation.houses?.house_number} para {reservation.common_areas?.name}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex gap-3 justify-end">
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <Button variant="destructive" onClick={() => handleCancel(reservation.id)} disabled={loading}>
                              Cancelar Reserva
                            </Button>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
