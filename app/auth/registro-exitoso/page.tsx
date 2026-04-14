import { Metadata } from "next"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: 'Registro Exitoso | InteliCon',
  description: 'Tu registro ha sido completado exitosamente.',
}

export const revalidate = 3600 // Static page, revalidate every hour

export default function RegistroExitosoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-lg">
        {/* Logo and Header */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">¡Registro Completado!</h1>
            <p className="mt-2 text-sm text-gray-600">
              Tu cuenta ha sido creada exitosamente.
            </p>
          </div>
        </div>

        {/* Button */}
        <Link
          href="/auth/login"
          className="block w-full rounded bg-blue-600 py-2 text-center text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Iniciar Sesión
        </Link>
      </div>
    </div>
  )
}
