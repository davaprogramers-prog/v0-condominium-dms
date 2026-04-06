'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface VisitsFilterProps {
  onStatusChange?: (status: string) => void
  onSearchChange?: (search: string) => void
  defaultStatus?: string
}

export function VisitsFilter({ onStatusChange, onSearchChange, defaultStatus = 'all' }: VisitsFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <Input
        placeholder="Buscar por nombre..."
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="flex-1"
      />
      <Select defaultValue={defaultStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Filtrar por estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="scheduled">Programadas</SelectItem>
          <SelectItem value="completed">Completadas</SelectItem>
          <SelectItem value="cancelled">Canceladas</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
