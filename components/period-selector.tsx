"use client"

import { useCallback, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const now = new Date()
  const currentYear = parseInt(searchParams.get("año") as string) || now.getFullYear()
  const currentMonth = parseInt(searchParams.get("mes") as string) || now.getMonth() + 1

  const handlePrevMonth = () => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
    updatePeriod(prevYear, prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
    updatePeriod(nextYear, nextMonth)
  }

  const handleMonthChange = (value: string) => {
    updatePeriod(currentYear, parseInt(value))
  }

  const handleYearChange = (value: string) => {
    updatePeriod(parseInt(value), currentMonth)
  }

  const updatePeriod = (year: number, month: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("año", String(year))
    params.set("mes", String(month))
    router.push(`?${params.toString()}`)
  }

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ]

  const years = Array.from({ length: 10 }, (_, i) => ({
    value: String(currentYear - 5 + i),
    label: String(currentYear - 5 + i),
  }))

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={handlePrevMonth}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex gap-2 min-w-56">
        <Select value={String(currentMonth)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(currentYear)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y.value} value={y.value}>
                {y.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" size="sm" onClick={handleNextMonth}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

