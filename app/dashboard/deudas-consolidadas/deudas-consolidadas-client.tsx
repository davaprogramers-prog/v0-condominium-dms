"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, Eye } from "lucide-react"
import { DeudaDetailDialog } from "./deuda-detail-dialog"
import { EnviarMensajeDialog } from "./enviar-mensaje-dialog"
import { type CondoTheme } from "@/lib/theme-utils"

interface DeudaConsolidada {
  houseNumber: string | number
  ownerName: string | null
  houseId: string
  commonExpenses: number
  variableExpenses: number
  finesAmount: number
  finesUF: number
  totalDebt: number
  detailsCount: number
}

interface DeudasConsolidadasClientProps {
  debts: DeudaConsolidada[]
  currencySymbol: string
  theme: CondoTheme
  condoId: string
  userId: string
}

function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("es-CL", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`
}

export function DeudasConsolidadasClient({
  debts,
  currencySymbol,
  theme,
  condoId,
  userId,
}: DeudasConsolidadasClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDeuda, setSelectedDeuda] = useState<DeudaConsolidada | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [detalleOpen, setDetalleOpen] = useState<string | null>(null)

  const filteredDebts = debts.filter(
    (debt) =>
      debt.houseNumber.toString().includes(searchTerm) ||
      (debt.ownerName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  const totalDeudaGeneral = debts.reduce((sum, debt) => sum + debt.totalDebt, 0)
  const totalDeudaUF = debts.reduce((sum, debt) => sum + debt.finesUF, 0)

  const handleShowDetail = (debt: DeudaConsolidada) => {
    setSelectedDeuda(debt)
    setShowDetailDialog(true)
  }

  const handleSendMessage = (debt: DeudaConsolidada) => {
    setSelectedDeuda(debt)
    setShowMessageDialog(true)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumen de totales */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card style={{ backgroundColor: theme.cardBgColor, borderColor: theme.borderColor }}>
            <CardHeader>
              <CardTitle
                className="text-sm font-medium"
                style={{ color: theme.textColor, opacity: 0.7 }}
              >
                Total Deuda General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="text-3xl font-bold"
                style={{ color: "#ef4444" }}
              >
                {formatCurrency(totalDeudaGeneral, currencySymbol)}
              </p>
              <p className="text-xs mt-2" style={{ color: theme.textColor, opacity: 0.6 }}>
                De {debts.length} casa{debts.length !== 1 ? "s" : ""} con deuda
              </p>
            </CardContent>
          </Card>

          {totalDeudaUF > 0 && (
            <Card style={{ backgroundColor: theme.cardBgColor, borderColor: theme.borderColor }}>
              <CardHeader>
                <CardTitle
                  className="text-sm font-medium"
                  style={{ color: theme.textColor, opacity: 0.7 }}
                >
                  Total Deuda en UF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="text-3xl font-bold"
                  style={{ color: "#3b82f6" }}
                >
                  {totalDeudaUF.toFixed(2)} UF
                </p>
                <p className="text-xs mt-2" style={{ color: theme.textColor, opacity: 0.6 }}>
                  Multas pendientes
                </p>
              </CardContent>
            </Card>
          )}

          <Card style={{ backgroundColor: theme.cardBgColor, borderColor: theme.borderColor }}>
            <CardHeader>
              <CardTitle
                className="text-sm font-medium"
                style={{ color: theme.textColor, opacity: 0.7 }}
              >
                Casas con Deuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className="text-3xl font-bold"
                style={{ color: "#8b5cf6" }}
              >
                {debts.length}
              </p>
              <p className="text-xs mt-2" style={{ color: theme.textColor, opacity: 0.6 }}>
                Requieren acción
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Búsqueda */}
        <div>
          <Input
            placeholder="Buscar por número de casa o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              backgroundColor: theme.inputBgColor,
              borderColor: theme.inputBorderColor,
              color: theme.inputTextColor,
            }}
          />
        </div>

        {/* Tabla de deudas */}
        <Card style={{ backgroundColor: theme.cardBgColor, borderColor: theme.borderColor }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow style={{ borderColor: theme.borderColor }}>
                    <TableHead style={{ color: theme.textColor }}>Casa</TableHead>
                    <TableHead style={{ color: theme.textColor }}>Residente</TableHead>
                    <TableHead className="text-right" style={{ color: theme.textColor }}>
                      Gasto Común
                    </TableHead>
                    <TableHead className="text-right" style={{ color: theme.textColor }}>
                      Gasto Variable
                    </TableHead>
                    <TableHead className="text-right" style={{ color: theme.textColor }}>
                      Multas CLP
                    </TableHead>
                    <TableHead className="text-right" style={{ color: theme.textColor }}>
                      Multas UF
                    </TableHead>
                    <TableHead className="text-right" style={{ color: theme.textColor }}>
                      Total Deuda
                    </TableHead>
                    <TableHead className="text-center" style={{ color: theme.textColor }}>
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebts.length > 0 ? (
                    filteredDebts.map((debt) => (
                      <TableRow
                        key={debt.houseId}
                        style={{
                          backgroundColor: theme.cardBgColor,
                          borderColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                      >
                        <TableCell className="font-bold">#{debt.houseNumber}</TableCell>
                        <TableCell>{debt.ownerName || "Sin asignar"}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(debt.commonExpenses, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(debt.variableExpenses, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(debt.finesAmount, currencySymbol)}
                        </TableCell>
                        <TableCell className="text-right">
                          {debt.finesUF > 0 ? `${debt.finesUF.toFixed(2)} UF` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className="bg-red-600 text-white hover:bg-red-700"
                            style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
                          >
                            {formatCurrency(debt.totalDebt, currencySymbol)}
                            {debt.finesUF > 0 && ` + ${debt.finesUF.toFixed(2)} UF`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShowDetail(debt)}
                            title="Ver detalles"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendMessage(debt)}
                            title="Enviar mensaje"
                            className="h-8 w-8 p-0"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8" style={{ color: theme.textColor, opacity: 0.6 }}>
                        No se encontraron resultados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      {selectedDeuda && (
        <DeudaDetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          deuda={selectedDeuda}
          currencySymbol={currencySymbol}
          theme={theme}
        />
      )}

      {/* Message Dialog */}
      {selectedDeuda && (
        <EnviarMensajeDialog
          open={showMessageDialog}
          onOpenChange={setShowMessageDialog}
          deuda={selectedDeuda}
          currencySymbol={currencySymbol}
          theme={theme}
          condoId={condoId}
          userId={userId}
        />
      )}
    </>
  )
}
