"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

interface PeriodSelectorProps {
  month: number
  year: number
}

export function PeriodSelector({ month, year }: PeriodSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const years = Array.from({ length: Math.max(1, currentYear - 1999) }, (_, index) => currentYear - index)

  const updatePeriod = (nextYear: number, nextMonth: number) => {
    const validMonth = nextYear === currentYear ? Math.min(nextMonth, currentMonth) : nextMonth
    const params = new URLSearchParams(window.location.search)
    params.set("año", String(nextYear))
    params.set("mes", String(validMonth))
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  const isCurrentPeriod = year === currentYear && month === currentMonth

  return (
    <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Seleccionar período">
      <Select value={String(month)} onValueChange={(value) => updatePeriod(year, Number(value))} disabled={isPending}>
        <SelectTrigger className="w-44" aria-label="Mes">
          <SelectValue placeholder="Seleccionar mes" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {MONTHS.map((name, index) => (
              <SelectItem
                key={name}
                value={String(index + 1)}
                disabled={year === currentYear && index + 1 > currentMonth}
              >
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(value) => updatePeriod(Number(value), month)} disabled={isPending}>
        <SelectTrigger className="w-28" aria-label="Año">
          <SelectValue placeholder="Seleccionar año" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {years.map((yearOption) => (
              <SelectItem key={yearOption} value={String(yearOption)}>
                {yearOption}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {!isCurrentPeriod && (
        <Button variant="outline" onClick={() => updatePeriod(currentYear, currentMonth)} disabled={isPending}>
          Mes actual
        </Button>
      )}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {isPending ? "Cargando período seleccionado" : ""}
      </span>
    </div>
  )
}
