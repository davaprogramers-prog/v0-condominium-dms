import { createClient } from "@/lib/supabase/server"
import { getCondoExpenses, getCondoIncome } from "../gastos/actions"
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; año?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("condo_id, role")
    .eq("id", user?.id)
    .single()

  const condoId = profile?.condo_id

  // Get period from query params or use current month
  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.año as string) || now.getFullYear()
  const month = parseInt(params.mes as string) || now.getMonth() + 1

  // Get expenses and income
  let expenses: any[] = []
  let income: any[] = []

  if (condoId) {
    expenses = await getCondoExpenses(condoId, year, month)
    income = await getCondoIncome(condoId, year, month)
  }

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
  const totalIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0)

  // Prepare data for charts
  const expensesByCategory: Record<string, number> = {}
  expenses.forEach((exp) => {
    const category = exp.category || "Otro"
    expensesByCategory[category] = (expensesByCategory[category] || 0) + exp.amount
  })

  const incomeByType: Record<string, number> = {}
  income.forEach((inc) => {
    const type = inc.income_type === "cuota" ? "Cuotas" : "Variables"
    incomeByType[type] = (incomeByType[type] || 0) + inc.amount
  })

  const pieExpensesData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  const pieIncomeData = Object.entries(incomeByType).map(([name, value]) => ({
    name,
    value,
  }))

  const barData = [
    { nombre: "Ingresos", valor: totalIncome, fill: "#22c55e" },
    { nombre: "Gastos", valor: totalExpenses, fill: "#ef4444" },
  ]

  const COLORS = ["#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"]

  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes de Finanzas</h1>
        <p className="text-muted-foreground">Análisis completo de ingresos y gastos - {monthName}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                ${totalIncome.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Gastos</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                ${totalExpenses.toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-500 opacity-30" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Diferencia</p>
              <p className={`text-3xl font-bold mt-1 ${totalIncome - totalExpenses >= 0 ? "text-green-600" : "text-red-600"}`}>
                ${(totalIncome - totalExpenses).toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
            <DollarSign className="h-10 w-10 opacity-30" />
          </div>
        </div>
      </div>

      {/* Charts */}
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
                ${income.length > 0 ? (totalIncome / income.length).toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }) : "$0"}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-muted-foreground">Promedio por Gasto</span>
              <span className="font-semibold">
                ${expenses.length > 0 ? (totalExpenses / expenses.length).toLocaleString("es-CL", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }) : "$0"}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-sm text-muted-foreground">Total de Transacciones</span>
              <span className="font-semibold">{expenses.length + income.length}</span>
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
    </div>
  )
}


