'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface SupplyRequestsFilterProps {
  onStatusChange?: (status: string) => void
  onPriorityChange?: (priority: string) => void
  onCategoryChange?: (category: string) => void
  onSearchChange?: (search: string) => void
  defaultStatus?: string
  defaultPriority?: string
  defaultCategory?: string
}

export function SupplyRequestsFilter({
  onStatusChange,
  onPriorityChange,
  onCategoryChange,
  onSearchChange,
  defaultStatus = 'all',
  defaultPriority = 'all',
  defaultCategory = 'all',
}: SupplyRequestsFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      <Input
        placeholder="Buscar solicitudes..."
        onChange={(e) => onSearchChange?.(e.target.value)}
        className="flex-1"
      />
      <Select defaultValue={defaultStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="pending">Pendientes</SelectItem>
          <SelectItem value="approved">Aprobadas</SelectItem>
          <SelectItem value="purchased">Compradas</SelectItem>
          <SelectItem value="rejected">Rechazadas</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue={defaultPriority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="low">Baja</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="urgent">Urgente</SelectItem>
        </SelectContent>
      </Select>
      <Select defaultValue={defaultCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="cleaning">Limpieza</SelectItem>
          <SelectItem value="materials">Materiales</SelectItem>
          <SelectItem value="supplies">Suministros</SelectItem>
          <SelectItem value="maintenance">Mantenimiento</SelectItem>
          <SelectItem value="other">Otro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
