"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditIncomeDialog } from "./edit-income-dialog"
import { ExternalLink } from "lucide-react"

interface IngresosTableProps {
  income: any[]
  houses: any[]
  isAdmin: boolean
  currentYear: number
  currentMonth: number
}

export function IngresosTable({ income, houses, isAdmin, currentYear, currentMonth }: IngresosTableProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  return (
    <>
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Fecha</th>
                <th className="px-6 py-3 text-left font-semibold">Casa</th>
                <th className="px-6 py-3 text-left font-semibold">Tipo</th>
                <th className="px-6 py-3 text-left font-semibold">Descripcion</th>
                <th className="px-6 py-3 text-left font-semibold">Monto</th>
                <th className="px-6 py-3 text-left font-semibold">Comprobante</th>
                {isAdmin && <th className="px-6 py-3 text-left font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {income && income.length > 0 ? (
                income.map((inc) => {
                  const incomeYear = new Date(inc.income_date).getFullYear()
                  const incomeMonth = new Date(inc.income_date).getMonth() + 1
                  const isCurrentIncomeMonth = incomeYear === currentYear && incomeMonth === currentMonth
                  const canEdit = isCurrentIncomeMonth || isAdmin

                  const house = inc.house_id ? houses.find((h: any) => h.id === inc.house_id) : null

                  return (
                    <tr key={inc.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {new Date(inc.income_date).toLocaleDateString("es-CL")}
                      </td>
                      <td className="px-6 py-3">
                        {house ? `Casa #${house.house_number}` : "-"}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                          Cuota
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-xs">
                        {inc.description || "-"}
                      </td>
                      <td className="px-6 py-3 font-semibold text-green-600">
                        ${inc.amount.toLocaleString("es-CL", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-6 py-3">
                        {inc.receipt_url ? (
                          <button
                            onClick={() => setSelectedImage({ 
                              url: inc.receipt_url, 
                              title: house ? `Casa #${house.house_number}` : "Comprobante" 
                            })}
                            className="text-primary hover:underline text-xs"
                          >
                            Ver imagen
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3">
                          {canEdit ? (
                            <EditIncomeDialog income={inc} houses={houses} />
                          ) : (
                            <span className="text-xs text-muted-foreground">Solo lectura</span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-muted-foreground">
                    No hay ingresos registrados para este periodo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                title="Abrir en nueva pestana"
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
