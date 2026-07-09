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
    const date = new Date(dateString)
    setFormatted(date.toLocaleDateString('es-CL'))
  }, [dateString])

  // No renderear nada en servidor, solo placeholder vacío
  if (!mounted) {
    return <span className={className} style={style}>&nbsp;</span>
  }

  return <span className={className} style={style}>{formatted}</span>
}
