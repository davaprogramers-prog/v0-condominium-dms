import { Metadata } from "next"
import Link from "next/link"
import { Mail } from "lucide-react"

export const metadata: Metadata = {
  title: 'Registro Exitoso | InteliCon',
  description: 'Tu registro ha sido completado exitosamente. Por favor confirma tu email.',
}

export const revalidate = 3600 // Static page, revalidate every hour

export default function RegistroExitosoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-white p-8 shadow-lg">
        {/* Logo and Header */}
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Registro Exitoso</h1>
            <p className="mt-2 text-sm text-gray-600">
              Hemos enviado un correo de confirmación a tu dirección de email.
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="rounded bg-blue-50 p-4 text-sm text-blue-800 border border-blue-200">
          <p className="font-medium mb-1">Por favor revisa tu bandeja de entrada</p>
          <p>Confirma tu cuenta haciendo clic en el enlace del email que te enviamos. Si no ves el email, revisa tu carpeta de spam.</p>
        </div>

        {/* Button */}
        <Link
          href="/auth/login"
          className="block w-full rounded bg-blue-600 py-2 text-center text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Ir a Iniciar Sesión
        </Link>

        {/* Additional Help */}
        <div className="text-center text-sm text-gray-600">
          ¿Necesitas ayuda?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Contacta con soporte
          </Link>
        </div>
      </div>
    </div>
  )
}
