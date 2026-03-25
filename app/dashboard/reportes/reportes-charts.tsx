'use client'

import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts"

interface ReportesChartsProps {
  totalExpenses: number
  totalIncome: number
  barData: Array<{ nombre: string; valor: number; fill: string }>
  pieExpensesData: Array<{ name: string; value: number }>
  pieIncomeData: Array<{ name: string; value: number }>
}

const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]

export function ReportesCharts({
  totalExpenses,
  totalIncome,
  barData,
  pieExpensesData,
  pieIncomeData,
}: ReportesChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Ingresos vs Gastos Bar Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Comparativa Ingresos vs Gastos</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip 
              formatter={(value) => `$${value.toLocaleString("es-CL")}`}
            />
            <Bar dataKey="valor" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gastos por Categoría Pie Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Distribución de Gastos por Categoría</h2>
        {pieExpensesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieExpensesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieExpensesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString("es-CL")}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-muted-foreground">
            Sin datos de gastos para mostrar
          </div>
        )}
      </div>

      {/* Ingresos por Tipo Pie Chart */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Distribución de Ingresos por Tipo</h2>
        {pieIncomeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieIncomeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieIncomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString("es-CL")}`} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-muted-foreground">
            Sin datos de ingresos para mostrar
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Estadísticas</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-muted-foreground">Promedio por Ingreso</span>
            <span className="font-semibold">
              ${totalIncome > 0 ? (totalIncome).toLocaleString("es-CL", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }) : "$0"}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-muted-foreground">Promedio por Gasto</span>
            <span className="font-semibold">
              ${totalExpenses > 0 ? (totalExpenses).toLocaleString("es-CL", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }) : "$0"}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-sm text-muted-foreground">Diferencia</span>
            <span className="font-semibold">
              ${(totalIncome - totalExpenses).toLocaleString("es-CL", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Razón Gastos/Ingresos</span>
            <span className="font-semibold">
              {totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : "0"}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
