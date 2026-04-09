export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4">InteliCon</h1>
      <p className="text-lg text-gray-600 mb-8">Sistema de Administración de Condominios</p>
      <div className="flex gap-4">
        <a href="/auth/login" className="px-6 py-2 border rounded-md hover:bg-gray-100">
          Iniciar Sesión
        </a>
        <a href="/auth/registro" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Registrarse
        </a>
      </div>
    </div>
  )
}

