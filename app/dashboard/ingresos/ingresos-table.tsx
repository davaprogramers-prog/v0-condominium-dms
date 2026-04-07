"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditIncomeDialog } from "./edit-income-dialog"
import { ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteIncome } from "./actions"

interface IngresosTableProps {
  income: any[]
  houses: any[]
  isAdmin: boolean
  currentYear: number
  currentMonth: number
}

type IncomeStatus = "pending" | "paid" | "overdue"

function getIncomeStatus(inc: any): { status: IncomeStatus; color: string; textColor: string } {
  const hasReceipt = inc.receipt_url
  const incomeDate = new Date(inc.income_date)
  const today = new Date()
  
  if (hasReceipt) {
    return { status: "paid", color: "bg-emerald-100", textColor: "text-emerald-700" }
  }
  
  if (incomeDate < new Date(today.getFullYear(), today.getMonth(), 1)) {
    return { status: "overdue", color: "bg-red-100", textColor: "text-white" }
  }
  
  return { status: "pending", color: "bg-white border-2 border-amber-200", textColor: "text-amber-600" }
}

export function IngresosTable({ income, houses, isAdmin, currentYear, currentMonth }: IngresosTableProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  const handleDelete = async (incomeId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este ingreso? Se marcará como pendiente de pago.")) {
      await deleteIncome(incomeId)
    }
  }

  return (
    <>
      <div className="space-y-6">
        {income && income.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {income.map((inc) => {
              const incomeYear = new Date(inc.income_date).getFullYear()
              const incomeMonth = new Date(inc.income_date).getMonth() + 1
              const isCurrentIncomeMonth = incomeYear === currentYear && incomeMonth === currentMonth
              const canEdit = isCurrentIncomeMonth || isAdmin
              const house = inc.house_id ? houses.find((h: any) => h.id === inc.house_id) : null
              const { status, color, textColor } = getIncomeStatus(inc)

              return (
                <div
                  key={inc.id}
                  className={`rounded-lg p-5 shadow-sm transition-all ${color} ${
                    status === "overdue" ? "bg-red-600" : ""
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`text-lg font-bold ${status === "overdue" ? "text-white" : ""}`}>
                          Casa #{house?.house_number || "?"}
                        </h3>
                        <p className={`text-xs ${status === "overdue" ? "text-red-100" : "text-muted-foreground"}`}>
                          {new Date(inc.income_date).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        status === "paid" ? "bg-blue-100 text-blue-700" :
                        status === "overdue" ? "bg-red-700 text-white" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {status === "paid" ? "Pagado" : status === "overdue" ? "En Mora" : "Pendiente"}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className={`${status === "overdue" ? "text-white" : textColor}`}>
                      <p className="text-xs opacity-75">Monto</p>
                      <p className="text-2xl font-bold">
                        ${inc.amount.toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>

                    {/* Description */}
                    {inc.description && (
                      <p className={`text-xs ${status === "overdue" ? "text-red-100" : "text-muted-foreground"}`}>
                        {inc.description}
                      </p>
                    )}

                    {/* Receipt Button */}
                    {inc.receipt_url && (
                      <button
                        onClick={() => setSelectedImage({ 
                          url: inc.receipt_url, 
                          title: house ? `Casa #${house.house_number}` : "Comprobante" 
                        })}
                        className={`text-xs font-medium underline ${
                          status === "paid" ? "text-blue-600 hover:text-blue-800" :
                          status === "overdue" ? "text-white hover:opacity-90" :
                          "text-primary hover:text-primary/80"
                        }`}
                      >
                        Ver comprobante
                      </button>
                    )}

                    {/* Actions */}
                    {isAdmin && canEdit && (
                      <div className="flex gap-2 pt-2">
                        <EditIncomeDialog income={inc} houses={houses} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(inc.id)}
                          className="flex-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground rounded-lg border border-dashed p-8">
            <p>No hay ingresos registrados para este período.</p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">Comprobante - {selectedImage?.title}</DialogTitle>
              <a
                href={selectedImage?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </DialogHeader>
          <div className="px-4 pb-4">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={`Comprobante de ${selectedImage.title}`}
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg border"
                crossOrigin="anonymous"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
