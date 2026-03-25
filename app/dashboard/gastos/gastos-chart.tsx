"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface GastosChartProps {
  last12Months: Array<{ monthName: string; expenses: number; income: number }>
}

export function GastosChart({ last12Months }: GastosChartProps) {
  if (last12Months.length === 0) return null
  
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Ultimos 12 meses</h3>
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={last12Months} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="monthName" 
              tick={{ fontSize: 10, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip 
              formatter={(value: number) => `$${value.toLocaleString("es-CL")}`}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Bar 
              dataKey="expenses" 
              fill="#ec4899" 
              radius={[4, 4, 0, 0]}
              maxBarSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
