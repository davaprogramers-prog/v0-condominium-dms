"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditExpenseDialog } from "./edit-expense-dialog"
import { Building2, User, FileText, CheckCircle } from "lucide-react"

interface GastosListProps {
  expenses: any[]
  categories: Record<string, string>
  isAdmin: boolean
  currentYear: number
  currentMonth: number
}

const categoryIcons: Record<string, typeof Building2> = {
  reparacion: Building2,
  mantenimiento: Building2,
  servicios: Building2,
  suministros: Building2,
  otro: Building2,
}

const categoryColors: Record<string, string> = {
  reparacion: "bg-orange-100 text-orange-700",
  mantenimiento: "bg-blue-100 text-blue-700",
  servicios: "bg-purple-100 text-purple-700",
  suministros: "bg-green-100 text-green-700",
  otro: "bg-gray-100 text-gray-700",
}

export function GastosList({ expenses, categories, isAdmin, currentYear, currentMonth }: GastosListProps) {
  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
        <p className="text-muted-foreground">No hay gastos registrados para este periodo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const expenseYear = new Date(expense.expense_date).getFullYear()
        const expenseMonth = new Date(expense.expense_date).getMonth() + 1
        const isCurrentExpenseMonth = expenseYear === currentYear && expenseMonth === currentMonth
        const canEdit = isCurrentExpenseMonth || isAdmin
        const Icon = categoryIcons[expense.category] || Building2
        const colorClass = categoryColors[expense.category] || categoryColors.otro

        return (
          <div 
            key={expense.id} 
            className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Icon className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {categories[expense.category] || expense.category}
                  </p>
                  <h3 className="font-semibold text-base truncate">{expense.title}</h3>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground truncate">{expense.description}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg">
                    ${expense.amount.toLocaleString("es-CL")}
                  </p>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center gap-2 mt-3">
                {expense.receipt_url && (
                  <a
                    href={expense.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge variant="secondary" className="bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer">
                      <FileText className="h-3 w-3 mr-1" />
                      DOC
                    </Badge>
                  </a>
                )}
                <Badge variant="secondary" className="bg-emerald-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  PAGO
                </Badge>
                
                {isAdmin && canEdit && (
                  <div className="ml-auto">
                    <EditExpenseDialog expense={expense} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
