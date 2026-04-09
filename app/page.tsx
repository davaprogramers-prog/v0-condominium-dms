export default function Page() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">InteliCon</h1>
          <div className="flex gap-2">
            <a href="/auth/login" className="px-4 py-2 text-sm border rounded hover:bg-muted">
              Iniciar Sesión
            </a>
            <a href="/auth/registro" className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
              Registrarse
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center space-y-6">
          <h2 className="text-4xl font-bold">Administra tu condominio de forma integral</h2>
          <p className="text-lg text-muted-foreground">
            InteliCon es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/auth/registro" className="px-6 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
              Comenzar ahora
            </a>
            <a href="/auth/login" className="px-6 py-2 border rounded hover:bg-muted">
              Ya tengo cuenta
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
