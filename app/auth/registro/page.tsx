import Link from "next/link"
import { RegistroForm } from "./registro-form"

export default function RegistroPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-6 shadow-lg">
        <div className="flex flex-col items-center justify-center gap-3">
          <img 
            src="/intelicon-logo.png" 
            alt="InteliCon Logo" 
            className="h-16 w-auto object-contain"
          />
          <p className="text-sm text-gray-600">Crea tu cuenta</p>
        </div>
        
        <RegistroForm />

        <div className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  )
}
