'use client'

import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CondoTheme, getContrastTextColor } from "@/lib/theme-utils"

interface ReportesHeaderProps {
  year: number
  month: number
  prevMonth: number
  prevYear: number
  nextMonth: number
  nextYear: number
  canGoNext: boolean
  theme: CondoTheme | null
}

export function ReportesHeader({
  year,
  month,
  prevMonth,
  prevYear,
  nextMonth,
  nextYear,
  canGoNext,
  theme,
}: ReportesHeaderProps) {
  const monthName = new Date(year, month - 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  })

  // Determine colors from theme or use defaults
  const inputBgColor = theme?.enable_custom_theme 
    ? theme.input_bg_color 
    : "#ffffff"
  const inputTextColor = theme?.enable_custom_theme 
    ? theme.input_text_color 
    : "#0f172a"
  const borderColor = getContrastTextColor(inputBgColor) === '#ffffff' ? '#ffffff' : '#e2e8f0'

  return (
    <div className="space-y-3">
      {/* Title - Line 1 */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Reportes de Finanzas</h1>
        <p className="text-muted-foreground text-sm">Analisis completo de ingresos y gastos</p>
      </div>

      {/* Month Navigation - Line 2, Responsive */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/dashboard/reportes?mes=${prevMonth}&año=${prevYear}`} className="flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>

        <div
          className="flex-1 min-w-[120px] px-3 py-2 rounded-lg text-sm font-medium text-center capitalize border transition-colors flex-shrink-0 md:flex-1"
          style={{
            backgroundColor: inputBgColor,
            color: inputTextColor,
            borderColor: inputBgColor,
          }}
        >
          {monthName}
        </div>

        {canGoNext ? (
          <Link href={`/dashboard/reportes?mes=${nextMonth}&año=${nextYear}`} className="flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
