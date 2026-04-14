"use client"

import { useState } from "react"
import { createVariableIncome } from "@/app/dashboard/actions"
import { deleteVariableIncome } from "@/app/dashboard/ingresos/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/file-upload"
import { Plus, TrendingUp, Trash2, ExternalLink } from "lucide-react"
import { useTheme } from "@/app/dashboard/theme-context"

interface IngresoVariableClientProps {
  incomes: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

type IncomeStatus = "pending" | "paid"

// Comparador natural para ordenar números correctamente (101, 102, 103, 101-A, 101-B, etc)
function compareHouseNumbers(a: string | number, b: string | number): number {
  const aStr = String(a).toLowerCase()
  const bStr = String(b).toLowerCase()

  const aMatch = aStr.match(/^(\d+)([a-z]?)$/)
  const bMatch = bStr.match(/^(\d+)([a-z]?)$/)

  if (aMatch && bMatch) {
    const aNum = parseInt(aMatch[1], 10)
    const bNum = parseInt(bMatch[1], 10)

    if (aNum !== bNum) return aNum - bNum
    return aMatch[2].localeCompare(bMatch[2])
  }

  return aStr.localeCompare(bStr)
}

function getVariableIncomeStatus(inc: any): { status: IncomeStatus; color: string; textColor: string } {
  const hasReceipt = inc.receipt_url
  return hasReceipt
    ? { status: "paid", color: "bg-emerald-100", textColor: "text-emerald-700" }
    : { status: "pending", color: "bg-white border-2 border-amber-200", textColor: "text-amber-600" }
}

export function IngresoVariableClient({ incomes, currencySymbol, isAdmin }: IngresoVariableClientProps) {
  const [open, setOpen] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState("")
  const { dialogBgColor, dialogTextColor, inputBgColor, inputTextColor } = useTheme()
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null)

  const total = incomes.reduce((a, i) => a + Number(i.amount || 0), 0)

  // Ordenar ingresos por descripción/fuente naturalmente
  const sortedIncomes = [...incomes].sort((a, b) => {
    const descA = (a.description as string) || ""
    const descB = (b.description as string) || ""
    return compareHouseNumbers(descA, descB)
  })

  const handleDelete = async (incomeId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este ingreso variable?")) {
      await deleteVariableIncome(incomeId)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ingreso Variable</h1>
          <p className="text-sm text-muted-foreground">
            {"Total acumulado: "}
            <span className="font-semibold text-foreground">{currencySymbol}{total.toLocaleString()}</span>
          </p>
        </div>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                style={{
                  backgroundColor: "#2563eb",
                  color: "white",
                  padding: "12px 24px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "2px solid #1d4ed8",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                <TrendingUp className="h-5 w-5" />
                Nuevo Ingreso Variable
              </Button>
            </DialogTrigger>
            <DialogContent style={{ backgroundColor: dialogBgColor, color: dialogTextColor, borderColor: dialogTextColor }} className="max-w-lg">
              <DialogHeader>
                <DialogTitle style={{ color: dialogTextColor }}>Registrar Ingreso Variable</DialogTitle>
              </DialogHeader>
              <form
                action={async (fd) => {
                  fd.set("receipt_url", receiptUrl)
                  await createVariableIncome(fd)
                  setOpen(false)
                  setReceiptUrl("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description" style={{ color: dialogTextColor }}>Descripcion</Label>
                  <Input id="description" name="description" placeholder="Descripcion del ingreso" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount" style={{ color: dialogTextColor }}>Monto</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="income_date" style={{ color: dialogTextColor }}>Fecha</Label>
                    <Input id="income_date" name="income_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source" style={{ color: dialogTextColor }}>Fuente / Origen</Label>
                  <Input id="source" name="source" placeholder="Ej: Arriendo sala, Multa, etc." style={{ borderColor: inputTextColor, backgroundColor: inputBgColor, color: inputTextColor }} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label style={{ color: dialogTextColor }}>Respaldo</Label>
                  <FileUpload bucket="receipts" onUpload={setReceiptUrl} label="Subir comprobante" />
                </div>
                <Button type="submit" className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white">Guardar Ingreso</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {incomes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground rounded-lg border border-dashed p-8">
          <TrendingUp className="h-10 w-10" />
          <p>No hay ingresos variables registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedIncomes.map((income) => {
            const { status, color, textColor } = getVariableIncomeStatus(income)

            return (
              <div
                key={income.id as string}
                className={`rounded-lg p-5 shadow-sm transition-all ${color}`}
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        {(income.description as string) || "Ingreso Variable"}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(income.income_date as string).toLocaleDateString("es-CL")}
                      </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${status === "paid" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                      }`}>
                      {status === "paid" ? "Pagado" : "Pendiente"}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className={textColor}>
                    <p className="text-xs opacity-75">Monto</p>
                    <p className="text-2xl font-bold">
                      ${Number(income.amount).toLocaleString("es-CL", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>

                  {/* Source */}
                  {income.source && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Fuente:</span> {income.source as string}
                    </p>
                  )}

                  {/* Receipt Button */}
                  {income.receipt_url && (
                    <button
                      onClick={() => setSelectedImage({
                        url: income.receipt_url as string,
                        title: income.description as string
                      })}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver comprobante
                    </button>
                  )}

                  {/* Actions */}
                  {isAdmin && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(income.id as string)}
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
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700">
          <div className="relative flex flex-col">
            <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <DialogTitle className="text-lg text-slate-900 dark:text-white flex-1">Comprobante - {selectedImage?.title}</DialogTitle>
              <a
                href={selectedImage?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex-shrink-0"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            <div className="px-4 py-4">
              {selectedImage && (
                <img
                  src={selectedImage.url}
                  alt={`Comprobante de ${selectedImage.title}`}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg border-2 border-slate-300 dark:border-slate-600"
                  crossOrigin="anonymous"
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
