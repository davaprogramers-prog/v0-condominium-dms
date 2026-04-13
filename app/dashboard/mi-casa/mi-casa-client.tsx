'use client'

import { useTheme } from "@/app/dashboard/theme-context"
import { DollarSign, FileText, TrendingUp } from "lucide-react"
import { PaymentUploadDialogThemedWrapper } from "./payment-upload-dialog-themed"
import { AvatarUpload } from "./avatar-upload"

interface MiCasaClientProps {
  house: any
  profile: any
  condo: any
  condoId: string
  houseId: string
  parameters: any
  currentMonthIncomes: any[]
  paymentProofs: any[]
  totalDue: number
  totalPaid: number
  balance: number
  hasApprovedProof: (incomeId: string, incomeType: string) => boolean
  getProofsForIncome: (incomeId: string, incomeType: string) => any[]
}

export function MiCasaClient(props: MiCasaClientProps) {
  const {
    house, profile, condo, condoId, houseId, parameters,
    currentMonthIncomes, totalDue, totalPaid, balance,
    hasApprovedProof, getProofsForIncome
  } = props

  const { cardBgColor, cardTextColor } = useTheme()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <AvatarUpload 
            currentAvatarUrl={profile?.avatar_url || undefined}
            userName={`${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Usuario"}
          />
          <div>
            <h1 className="text-3xl font-bold">Mi Casa #{house?.house_number}</h1>
            <p className="text-muted-foreground">Bienvenido, {profile?.first_name}</p>
          </div>
        </div>
        <PaymentUploadDialogThemedWrapper 
          condoId={condoId} 
          houseId={houseId}
          currencySymbol={condo?.currency_symbol}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div 
          className="rounded-lg border-2 p-4"
          style={{ 
            backgroundColor: cardBgColor, 
            borderColor: cardBgColor, 
            color: cardTextColor 
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">Gasto del Mes</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalDue}</p>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg border-2 p-4"
          style={{ 
            backgroundColor: cardBgColor, 
            borderColor: cardBgColor, 
            color: cardTextColor 
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">Pagado</p>
              <p className="text-lg font-bold">{condo?.currency_symbol}{totalPaid}</p>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg border-2 p-4"
          style={{ 
            backgroundColor: balance > 0 ? "#7f1d1d" : "#1e3a1f", 
            borderColor: balance > 0 ? "#991b1b" : "#15803d",
            color: cardTextColor
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className={`flex h-10 w-10 items-center justify-center rounded-lg`} 
              style={{ backgroundColor: balance > 0 ? "#dc2626" : "#16a34a" }}
            >
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs opacity-75">{balance > 0 ? "Deuda" : "Saldo"}</p>
              <p className="text-lg font-bold">
                {condo?.currency_symbol}{Math.abs(balance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Historial de Pagos - Mes Actual</h2>
        
        <div 
          className="rounded-lg border-2"
          style={{ backgroundColor: cardBgColor, borderColor: cardBgColor }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr 
                  className="border-b"
                  style={{ 
                    backgroundColor: "rgba(0, 0, 0, 0.3)", 
                    color: cardTextColor 
                  }}
                >
                  <th className="px-6 py-3 text-left font-semibold">Tipo de Ingreso</th>
                  <th className="px-6 py-3 text-left font-semibold">Monto</th>
                  <th className="px-6 py-3 text-left font-semibold">Comprobantes</th>
                  <th className="px-6 py-3 text-left font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {currentMonthIncomes?.map((income) => {
                  const proofs = getProofsForIncome(income.id, income.income_type)
                  const hasReceipt = proofs.length > 0
                  const isApproved = hasApprovedProof(income.id, income.income_type)
                  
                  return (
                    <tr 
                      key={income.id} 
                      className="border-b hover:opacity-80"
                      style={{ 
                        backgroundColor: cardBgColor, 
                        color: cardTextColor, 
                        borderColor: "rgba(0, 0, 0, 0.2)" 
                      }}
                    >
                      <td className="px-6 py-3 font-medium">{income.description || "Gasto Común"}</td>
                      <td className="px-6 py-3">{condo?.currency_symbol}{income.amount}</td>
                      <td className="px-6 py-3">
                        {hasReceipt ? (
                          <span className="text-blue-400">
                            {proofs.length} comprobante(s)
                          </span>
                        ) : (
                          <span style={{ opacity: 0.5 }}>Sin comprobante</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <span 
                          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: isApproved ? "#065f46" : hasReceipt ? "#78350f" : "#7f1d1d",
                            color: "#f1f5f9"
                          }}
                        >
                          {isApproved ? "Aprobado" : hasReceipt ? "En Revisión" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!currentMonthIncomes?.length && (
            <div 
              className="p-6 text-center opacity-50"
              style={{ color: cardTextColor }}
            >
              No hay ingresos registrados para este mes
            </div>
          )}
        </div>
      </div>

      {/* Vencimiento */}
      <div 
        className="rounded-lg border-2 p-4"
        style={{ 
          backgroundColor: "#78350f", 
          borderColor: "#92400e", 
          color: "#f1f5f9" 
        }}
      >
        <p className="text-sm">
          <span className="font-semibold">Fecha de Vencimiento:</span> {parameters?.payment_deadline_day} de cada mes
        </p>
      </div>
    </div>
  )
}
