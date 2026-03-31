export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ borderBottom: "1px solid #e5e7eb", padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>InteliCon</div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <a href="/auth/login" style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", textDecoration: "none", color: "#000" }}>Iniciar Sesión</a>
          <a href="/auth/registro" style={{ padding: "0.5rem 1rem", background: "#0066cc", color: "#fff", borderRadius: "0.375rem", textDecoration: "none" }}>Registrarse</a>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3rem", padding: "2rem" }}>
        <div style={{ maxWidth: "42rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
            Administra tu condominio de forma integral
          </h1>
          <p style={{ fontSize: "1.125rem", color: "#6b7280", marginBottom: "2rem" }}>
            InteliCon es la plataforma completa para gestionar gastos, ingresos, encuestas, documentos, proyectos y mucho más.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <a href="/auth/registro" style={{ padding: "0.75rem 1.5rem", background: "#0066cc", color: "#fff", borderRadius: "0.375rem", textDecoration: "none", fontWeight: "500" }}>Comenzar ahora</a>
            <a href="/auth/login" style={{ padding: "0.75rem 1.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", textDecoration: "none", color: "#000", fontWeight: "500" }}>Ya tengo cuenta</a>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: "42rem", borderTop: "1px solid #e5e7eb", paddingTop: "3rem" }}>
          <h2 style={{ fontSize: "1.875rem", fontWeight: "bold", textAlign: "center", marginBottom: "1.5rem" }}>Características</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {[
              { title: "Reportes financieros", desc: "Comparativas por mes, trimestre, semestre y año" },
              { title: "Control por casa", desc: "Cards de estado por casa e histórico de pagos" },
              { title: "Encuestas en vivo", desc: "Votaciones en tiempo real con resultados" },
              { title: "Documentos", desc: "Almacena reglamentos, sanciones y documentación" },
              { title: "Gestión de visitas", desc: "Registro de visitantes y control de acceso" },
              { title: "Proyectos de mejora", desc: "Crea proyectos con cotizaciones y seguimiento" },
            ].map((feature) => (
              <div key={feature.title} style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
                <h3 style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{feature.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{ borderTop: "1px solid #e5e7eb", padding: "1.5rem", textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
        InteliCon - Sistema de Administración de Condominios
      </footer>
    </div>
  )
}

