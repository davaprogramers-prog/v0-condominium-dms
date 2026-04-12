"use client"

import { useState } from "react"
import { createExpense, deleteExpense } from "@/app/dashboard/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileUpload } from "@/components/file-upload"
import { Plus, Trash2, Receipt, Image as ImageIcon } from "lucide-react"

interface GastosClientProps {
  expenses: Record<string, unknown>[]
  expenseTypes: Record<string, unknown>[]
  currencySymbol: string
  isAdmin: boolean
}

export function GastosClient({ expenses, expenseTypes, currencySymbol, isAdmin }: GastosClientProps) {
  const [open, setOpen] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [previewImg, setPreviewImg] = useState<string | null>(null)

  const totalAmount = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {"Total acumulado: "}
            <span className="font-semibold text-foreground">{currencySymbol}{totalAmount.toLocaleString()}</span>
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
                <Plus className="h-5 w-5" />
                Agregar Gasto
              </Button>


            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Gasto</DialogTitle>
              </DialogHeader>
              <form
                action={async (formData) => {
                  formData.set("receipt_url", receiptUrl)
                  formData.set("expense_type_id", selectedType)
                  await createExpense(formData)
                  setOpen(false)
                  setReceiptUrl("")
                  setSelectedType("")
                }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-2">
                  <Label>Tipo de Gasto</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map((t) => (
                        <SelectItem key={t.id as string} value={t.id as string}>
                          {t.name as string}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Input id="description" name="description" placeholder="Descripcion del gasto" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expense_date">Fecha</Label>
                    <Input id="expense_date" name="expense_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Respaldo fotografico</Label>
                  <FileUpload bucket="expenses" onUpload={setReceiptUrl} label="Subir comprobante" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea id="notes" name="notes" placeholder="Notas adicionales..." />
                </div>
                <Button type="submit" disabled={!selectedType}>Guardar Gasto</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {previewImg && (
        <Dialog open={!!previewImg} onOpenChange={() => setPreviewImg(null)}>
          <DialogContent className="max-w-2xl">
            <img src={previewImg} alt="Comprobante" className="w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado de Gastos</CardTitle>
          <CardDescription>{expenses.length} gastos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <Receipt className="h-10 w-10" />
              <p>No hay gastos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Respaldo</TableHead>
                    {isAdmin && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id as string}>
                      <TableCell className="whitespace-nowrap text-sm">{expense.expense_date as string}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {(expense.expense_types as Record<string, unknown>)?.name as string || "Sin tipo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{expense.description as string}</TableCell>
                      <TableCell className="text-right font-semibold text-red-600">
                        {currencySymbol}{Number(expense.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {expense.receipt_url ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImg(expense.receipt_url as string)}
                            className="text-primary hover:underline"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => deleteExpense(expense.id as string)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
