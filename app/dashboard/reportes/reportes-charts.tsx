'use client'

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts"

interface ReportesChartsProps {
  totalExpenses: number
  totalIncome: number
  barData: Array<{ nombre: string; valor: number; fill: string }>
  pieExpensesData: Array<{ name: string; value: number }>
  pieIncomeData: Array<{ name: string; value: number }>
  last12Months?: Array<{ monthName: string; expenses: number; income: number }>
  currencySymbol?: string
}

// Colors inspired by the reference app - vibrant and distinct
const EXPENSE_COLORS = ["#7c3aed", "#06b6d4", "#ec4899", "#84cc16", "#64748b", "#f97316"]
const INCOME_COLORS = ["#22c55e", "#10b981", "#34d399"]

export function ReportesCharts({
  totalExpenses,
  totalIncome,
  barData,
  pieExpensesData,
  pieIncomeData,
  last12Months = [],
  currencySymbol = "$",
}: ReportesChartsProps) {
  
  // Formato abreviado para los ejes del gráfico
  const formatCurrencyAbbreviated = (value: number) => {
    if (value >= 1000000) {
      return `${currencySymbol}${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}K`
    }
    return `${currencySymbol}${value.toLocaleString("es-CL")}`
  }

  // Formato completo para los totales
  const formatCurrencyFull = (value: number) => {
    return `${currencySymbol}${value.toLocaleString("es-CL")}`
  }

  // Calculate percentages for expenses
  const expensesWithPercent = pieExpensesData.map((item, index) => ({
    ...item,
    percent: totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : "0",
    color: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
  }))

  return (
    <div className="space-y-6">
      {/* 12-Month Comparison Chart */}
      {last12Months.length > 0 && (
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Ultimos 12 Meses</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={last12Months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrencyAbbreviated}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value: number) => `${currencySymbol}${value.toLocaleString("es-CL")}`}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
              />
              <Bar 
                dataKey="expenses" 
                name="Gastos" 
                fill="#ec4899" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar 
                dataKey="income" 
                name="Ingresos" 
                fill="#06b6d4" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Gastos por Categoría */}
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Egresos por Categoria</h2>
          {pieExpensesData.length > 0 ? (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieExpensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieExpensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${currencySymbol}${value.toLocaleString("es-CL")}`}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{formatCurrencyFull(totalExpenses)}</p>
                    <p className="text-lg font-bold">{currencySymbol}{totalExpenses.toLocaleString("es-CL")}</p>
                  </div>
                </div>
              </div>
              {/* Category Breakdown List */}
              <div className="mt-4 space-y-2 border-t pt-4">
                {expensesWithPercent.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: item.color }}
                      >
                        {item.percent}%
                      </span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {currencySymbol}{item.value.toLocaleString("es-CL")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sin datos de gastos para mostrar
            </div>
          )}
        </div>

        {/* Donut Chart - Ingresos por Tipo */}
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">Ingresos por Tipo</h2>
          {pieIncomeData.length > 0 ? (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieIncomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieIncomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INCOME_COLORS[index % INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => `${currencySymbol}${value.toLocaleString("es-CL")}`}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">{formatCurrencyFull(totalIncome)}</p>
                    <p className="text-lg font-bold text-green-600">{currencySymbol}{totalIncome.toLocaleString("es-CL")}</p>
                  </div>
                </div>
              </div>
              {/* Income Breakdown List */}
              <div className="mt-4 space-y-2 border-t pt-4">
                {pieIncomeData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-dashed last:border-0">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-sm font-medium"
                        style={{ color: INCOME_COLORS[index % INCOME_COLORS.length] }}
                      >
                        {totalIncome > 0 ? ((item.value / totalIncome) * 100).toFixed(1) : "0"}%
                      </span>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {currencySymbol}{item.value.toLocaleString("es-CL")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Sin datos de ingresos para mostrar
            </div>
          )}
        </div>
      </div>

      {/* Resumen Comparativo */}
      <div className="rounded-xl border bg-card p-4 md:p-6">
        <h2 className="text-lg font-semibold mb-4">Resumen del Periodo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
            <p className="text-xs text-muted-foreground mb-1">Total Ingresos</p>
            <p className="text-xl font-bold text-green-600">{formatCurrencyFull(totalIncome)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-pink-50 dark:bg-pink-950/30">
            <p className="text-xs text-muted-foreground mb-1">Total Gastos</p>
            <p className="text-xl font-bold text-pink-600">{formatCurrencyFull(totalExpenses)}</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-xs text-muted-foreground mb-1">Balance</p>
            <p className={`text-xl font-bold ${totalIncome - totalExpenses >= 0 ? "text-blue-600" : "text-red-600"}`}>
              {formatCurrencyFull(totalIncome - totalExpenses)}
            </p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30">
            <p className="text-xs text-muted-foreground mb-1">Razon G/I</p>
            <p className="text-xl font-bold text-purple-600">
              {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : "0"}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
