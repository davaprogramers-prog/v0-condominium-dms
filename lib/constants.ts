export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

export const PROJECT_STATUSES = {
  planificado: { label: 'Planificado', color: 'bg-muted text-muted-foreground' },
  en_curso: { label: 'En Curso', color: 'bg-primary/10 text-primary' },
  completado: { label: 'Completado', color: 'bg-success/10 text-success' },
} as const

export const SURVEY_STATUSES = {
  activa: { label: 'Activa', color: 'bg-success/10 text-success' },
  cerrada: { label: 'Cerrada', color: 'bg-muted text-muted-foreground' },
} as const

export const DEFAULT_EXPENSE_TYPES = [
  'Mantenimiento',
  'Limpieza',
  'Seguridad',
  'Jardineria',
  'Iluminacion',
  'Agua',
  'Electricidad',
  'Reparaciones',
  'Administrativos',
  'Otros',
]

export const DEFAULT_INCOME_TYPES = [
  'Gasto Comun',
  'Ingreso Variable',
  'Arriendo',
  'Multas',
  'Otros',
]

export const DEFAULT_DOCUMENT_TYPES = [
  'Reglamento',
  'Sanciones',
  'Partes Cursados',
  'Partes Pagados',
  'Actas de Reunion',
  'Contratos',
  'Otros',
]
