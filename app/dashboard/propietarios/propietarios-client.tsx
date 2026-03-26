"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Home, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Upload,
  FileCheck,
  User
} from "lucide-react"
import { UploadProofDialog } from "./upload-proof-dialog"
import { ApproveProofDialog } from "./approve-proof-dialog"

interface HouseWithStatus {
  id: string
  house_number: string
  owner_name: string
  owner_email?: string
  infractions: any[]
  totalFines: number
  paymentProof?: any
  isPaidFixed: boolean
  isPaidVariable: boolean
  isPaidComplete: boolean
}

interface PropietariosClientProps {
  houses: HouseWithStatus[]
  condoId: string
  isAdmin: boolean
  currentMonth: number
  currentYear: number
  fixedAmount: number
  variableAmount: number
  currencySymbol: string
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function PropietariosClient({
  houses,
  condoId,
  isAdmin,
  currentMonth,
  currentYear,
  fixedAmount,
  variableAmount,
  currencySymbol,
}: PropietariosClientProps) {
  const [expandedHouse, setExpandedHouse] = useState<string | null>(null)

  const totalAmount = fixedAmount + variableAmount
  const periodLabel = `${monthNames[currentMonth - 1]} ${currentYear}`

  // Summary stats
  const totalHouses = houses.length
  const paidHouses = houses.filter(h => h.isPaidComplete).length
  const pendingProofs = houses.filter(h => h.paymentProof?.status === "pending").length
  const unpaidHouses = totalHouses - paidHouses

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Propietarios</h1>
          <p className="text-muted-foreground text-sm">
            Estado de pagos - {periodLabel}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHouses}</p>
                <p className="text-xs text-muted-foreground">Total Casas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{paidHouses}</p>
                <p className="text-xs text-muted-foreground">Pagadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{pendingProofs}</p>
                <p className="text-xs text-muted-foreground">Por Revisar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 dark:bg-red-900/20 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{unpaidHouses}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Amounts Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gasto Comun Fijo</p>
              <p className="text-xl font-bold">{currencySymbol}{fixedAmount.toLocaleString("es-CL")}</p>
            </div>
            <div className="text-2xl text-muted-foreground">+</div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Gasto Comun Variable</p>
              <p className="text-xl font-bold">{currencySymbol}{variableAmount.toLocaleString("es-CL")}</p>
            </div>
            <div className="text-2xl text-muted-foreground">=</div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total a Pagar</p>
              <p className="text-2xl font-bold text-blue-600">{currencySymbol}{totalAmount.toLocaleString("es-CL")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Houses List */}
      <div className="space-y-3">
        {houses.map((house) => (
          <HouseCard
            key={house.id}
            house={house}
            isAdmin={isAdmin}
            condoId={condoId}
            currentMonth={currentMonth}
            currentYear={currentYear}
            fixedAmount={fixedAmount}
            variableAmount={variableAmount}
            currencySymbol={currencySymbol}
            isExpanded={expandedHouse === house.id}
            onToggle={() => setExpandedHouse(expandedHouse === house.id ? null : house.id)}
          />
        ))}
      </div>
    </div>
  )
}

function HouseCard({
  house,
  isAdmin,
  condoId,
  currentMonth,
  currentYear,
  fixedAmount,
  variableAmount,
  currencySymbol,
  isExpanded,
  onToggle,
}: {
  house: HouseWithStatus
  isAdmin: boolean
  condoId: string
  currentMonth: number
  currentYear: number
  fixedAmount: number
  variableAmount: number
  currencySymbol: string
  isExpanded: boolean
  onToggle: () => void
}) {
  const totalAmount = fixedAmount + variableAmount + house.totalFines
  const proofStatus = house.paymentProof?.status

  // Determine card border color based on status
  let borderClass = "border-l-4 border-l-gray-300"
  if (house.isPaidComplete) {
    borderClass = "border-l-4 border-l-green-500"
  } else if (proofStatus === "pending") {
    borderClass = "border-l-4 border-l-yellow-500"
  } else if (proofStatus === "rejected") {
    borderClass = "border-l-4 border-l-red-500"
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className={`${borderClass} transition-all hover:shadow-md`}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Casa #{house.house_number}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {house.owner_name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status Badge */}
                {house.isPaidComplete ? (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pagado
                  </Badge>
                ) : proofStatus === "pending" ? (
                  <Badge className="bg-yellow-500 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    Comprobante Enviado
                  </Badge>
                ) : proofStatus === "rejected" ? (
                  <Badge variant="destructive">
                    Rechazado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Pendiente
                  </Badge>
                )}

                {/* Fines Badge */}
                {house.totalFines > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Multa: {currencySymbol}{house.totalFines.toLocaleString("es-CL")}
                  </Badge>
                )}

                {/* Total */}
                <div className="text-right">
                  <p className="font-bold text-lg">{currencySymbol}{totalAmount.toLocaleString("es-CL")}</p>
                </div>

                {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Payment Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between sm:flex-col">
                <span className="text-sm text-muted-foreground">Gasto Fijo</span>
                <span className="font-medium flex items-center gap-2">
                  {currencySymbol}{fixedAmount.toLocaleString("es-CL")}
                  {house.isPaidFixed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-sm text-muted-foreground">Gasto Variable</span>
                <span className="font-medium flex items-center gap-2">
                  {currencySymbol}{variableAmount.toLocaleString("es-CL")}
                  {house.isPaidVariable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </span>
              </div>
              {house.totalFines > 0 && (
                <div className="flex justify-between sm:flex-col">
                  <span className="text-sm text-muted-foreground">Multas</span>
                  <span className="font-medium text-red-600">
                    {currencySymbol}{house.totalFines.toLocaleString("es-CL")}
                  </span>
                </div>
              )}
            </div>

            {/* Infractions Detail */}
            {house.infractions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-600">Multas Pendientes:</p>
                {house.infractions.map((inf) => (
                  <div key={inf.id} className="flex justify-between text-sm p-2 rounded bg-red-50 dark:bg-red-900/20">
                    <span>{inf.description}</span>
                    <span className="font-medium">{currencySymbol}{inf.fine_amount?.toLocaleString("es-CL")}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Proof Section */}
            {house.paymentProof && (
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Comprobante Subido
                  </span>
                  <Badge variant={proofStatus === "pending" ? "secondary" : proofStatus === "approved" ? "default" : "destructive"}>
                    {proofStatus === "pending" ? "Pendiente de Revision" : proofStatus === "approved" ? "Aprobado" : "Rechazado"}
                  </Badge>
                </div>
                {house.paymentProof.receipt_url && (
                  <a 
                    href={house.paymentProof.receipt_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver comprobante
                  </a>
                )}
                {house.paymentProof.rejection_reason && (
                  <p className="text-sm text-red-600 mt-2">
                    Motivo: {house.paymentProof.rejection_reason}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Owner can upload proof for gastos comunes if not paid */}
              {!house.isPaidComplete && (!house.paymentProof || house.paymentProof.status === "rejected" || house.paymentProof.payment_type !== "gastos_comunes") && (
                <UploadProofDialog
                  houseId={house.id}
                  condoId={condoId}
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  fixedAmount={fixedAmount}
                  variableAmount={variableAmount}
                  currencySymbol={currencySymbol}
                  paymentType="gastos_comunes"
                />
              )}

              {/* Owner can upload proof for multas if there are pending fines */}
              {house.totalFines > 0 && (
                <UploadProofDialog
                  houseId={house.id}
                  condoId={condoId}
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  fixedAmount={fixedAmount}
                  variableAmount={variableAmount}
                  finesAmount={house.totalFines}
                  currencySymbol={currencySymbol}
                  paymentType="multas"
                  infractions={house.infractions}
                />
              )}

              {/* Admin can approve pending proofs */}
              {isAdmin && house.paymentProof?.status === "pending" && (
                <ApproveProofDialog
                  proof={house.paymentProof}
                  house={house}
                  fixedAmount={fixedAmount}
                  variableAmount={variableAmount}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
