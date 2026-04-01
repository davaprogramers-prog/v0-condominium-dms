'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[v0] Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
        <div>
          <h1 className="text-2xl font-bold">Algo salió mal</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {error.message || 'Hubo un error al cargar esta página'}
          </p>
        </div>
        <button
          onClick={reset}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
