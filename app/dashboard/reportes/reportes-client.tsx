"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart3 } from "lucide-react"

const COLORS = ["#2563eb", "#16a34a", "#dc2626", "#ca8a04", "#9333ea", "#06b6d4", "#f97316", "#ec4899"]

interface ReportesClientProps {
  expenses: Record<string, unknown>[]
  expenseTypes: Record<string, unknown>[]
  currencySymbol: string
}

export function ReportesClient({ expenses, expenseTypes, currencySymbol }: ReportesClientProps) {
  const [compareMode, setCompareMode] = useState<"mensual" | "trimestral" | "semestral" | "anual">("mensual")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [compareYear, setCompareYear] = useState<string>("")

  const years = useMemo(() => {
    const yrs = new Set(expenses.map((e) => (e.expense_date as string)?.substring(0, 4)).filter(Boolean))
    return Array.from(yrs).sort()
  }, [expenses])

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2000, i, 1).toLocaleString("es", { month: "short" }),
      monthNum: i + 1,
      current: 0,
      compare: 0,
    }))

    expenses.forEach((e) => {
      const date = new Date(e.expense_date as string)
      const year = date.getFullYear().toString()
      const month = date.getMonth()
      const amount = Number(e.amount || 0)

      if (year === selectedYear) months[month].current += amount
      if (compareYear && year === compareYear) months[month].compare += amount
    })

    return months
  }, [expenses, selectedYear, compareYear])

  const quarterlyData = useMemo(() => {
    const quarters = [
      { name: "T1 (Ene-Mar)", current: 0, compare: 0 },
      { name: "T2 (Abr-Jun)", current: 0, compare: 0 },
      { name: "T3 (Jul-Sep)", current: 0, compare: 0 },
      { name: "T4 (Oct-Dic)", current: 0, compare: 0 },
    ]
    expenses.forEach((e) => {
      const date = new Date(e.expense_date as string)
      const year = date.getFullYear().toString()
      const q = Math.floor(date.getMonth() / 3)
      const amount = Number(e.amount || 0)
      if (year === selectedYear) quarters[q].current += amount
      if (compareYear && year === compareYear) quarters[q].compare += amount
    })
    return quarters
  }, [expenses, selectedYear, compareYear])

  const semesterData = useMemo(() => {
    const semesters = [
      { name: "S1 (Ene-Jun)", current: 0, compare: 0 },
      { name: "S2 (Jul-Dic)", current: 0, compare: 0 },
    ]
    expenses.forEach((e) => {
      const date = new Date(e.expense_date as string)
      const year = date.getFullYear().toString()
      const s = date.getMonth() < 6 ? 0 : 1
      const amount = Number(e.amount || 0)
      if (year === selectedYear) semesters[s].current += amount
      if (compareYear && year === compareYear) semesters[s].compare += amount
    })
    return semesters
  }, [expenses, selectedYear, compareYear])

  const byTypeData = useMemo(() => {
    const map: Record<string, number> = {}
    expenses
      .filter((e) => (e.expense_date as string)?.startsWith(selectedYear))
      .forEach((e) => {
        const typeName = ((e.expense_types as Record<string, unknown>)?.name as string) || "Otros"
        map[typeName] = (map[typeName] || 0) + Number(e.amount || 0)
      })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [expenses, selectedYear])

  const trendData = useMemo(() => {
    return monthlyData.map((m) => ({
      ...m,
      promedio: monthlyData.reduce((a, b) => a + b.current, 0) / 12,
    }))
  }, [monthlyData])

  const chartData = compareMode === "trimestral" ? quarterlyData : compareMode === "semestral" ? semesterData : monthlyData

  const currentTotal = expenses
    .filter((e) => (e.expense_date as string)?.startsWith(selectedYear))
    .reduce((a, e) => a + Number(e.amount || 0), 0)

  const currentAvg = currentTotal / 12

  const chartConfig = {
    current: { label: selectedYear, color: "#2563eb" },
    compare: { label: compareYear || "Comparar", color: "#16a34a" },
    promedio: { label: "Promedio", color: "#dc2626" },
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes de Gastos</h1>
        <p className="text-sm text-muted-foreground">Analisis comparativo y tendencias de gastos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total {selectedYear}</p>
            <p className="text-2xl font-bold">{currencySymbol}{currentTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Promedio Mensual</p>
            <p className="text-2xl font-bold">{currencySymbol}{Math.round(currentAvg).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Categorias</p>
            <p className="text-2xl font-bold">{byTypeData.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de Comparacion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label>Periodo</Label>
              <Select value={compareMode} onValueChange={(v) => setCompareMode(v as typeof compareMode)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Ano principal</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  {years.length === 0 && <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Comparar con</Label>
              <Select value={compareYear} onValueChange={setCompareYear}>
                <SelectTrigger><SelectValue placeholder="Seleccionar ano" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin comparacion</SelectItem>
                  {years.filter((y) => y !== selectedYear).map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {"Comparativo "}
              {compareMode === "mensual" ? "Mensual" : compareMode === "trimestral" ? "Trimestral" : "Semestral"}
            </CardTitle>
            <CardDescription>
              {selectedYear}
              {compareYear && compareYear !== "none" ? ` vs ${compareYear}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10" />
                <p>No hay datos para mostrar</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={compareMode === "mensual" ? "month" : "name"} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="current" fill="#2563eb" name={selectedYear} radius={[4, 4, 0, 0]} />
                  {compareYear && compareYear !== "none" && (
                    <Bar dataKey="compare" fill="#16a34a" name={compareYear} radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tendencia y Promedio</CardTitle>
            <CardDescription>Gastos mensuales con linea de promedio</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10" />
                <p>No hay datos para mostrar</p>
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="current" stroke="#2563eb" name={selectedYear} strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="promedio" stroke="#dc2626" name="Promedio" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Distribucion por Tipo de Gasto</CardTitle>
            <CardDescription>Desglose de gastos por categoria en {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            {byTypeData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                <BarChart3 className="h-10 w-10" />
                <p>No hay datos para mostrar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <PieChart>
                    <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                      {byTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-col gap-2">
                  {byTypeData.sort((a, b) => b.value - a.value).map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{currencySymbol}{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
