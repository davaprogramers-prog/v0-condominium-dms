'use client'

export default function Error({
  error,
}: {
  error: Error & { digest?: string }
}) {
  console.error('[v0] Root error caught:', error)
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <a href="/" className="text-blue-600 hover:underline">
          Volver a inicio
        </a>
      </div>
    </div>
  )
}
