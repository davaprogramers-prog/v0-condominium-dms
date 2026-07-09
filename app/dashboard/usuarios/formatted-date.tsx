'use client'

import { useEffect, useState } from 'react'

interface FormattedDateProps {
  dateString: string
  className?: string
  style?: React.CSSProperties
}

export function FormattedDate({ dateString, className, style }: FormattedDateProps) {
  const [mounted, setMounted] = useState(false)
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setMounted(true)
    // Parsear la fecha en formato YYYY-MM-DD para evitar issues de zona horaria
    // El string viene como "2026-07-02", lo convertimos sin UTC
    const [year, month, day] = dateString.split('T')[0].split('-')
    if (year && month && day) {
      // Crear fecha local explícitamente
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      setFormatted(date.toLocaleDateString('es-CL'))
    } else {
      setFormatted('')
    }
  }, [dateString])

  // No renderear nada en servidor, solo placeholder vacío
  if (!mounted) {
    return <span className={className} style={style}>&nbsp;</span>
  }

  return <span className={className} style={style}>{formatted}</span>
}
