"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type FilterType = "pending" | "approved" | "rejected" | "all"

interface House {
  id: string
  house_number?: string | number
  number?: string | number
}

interface Proof {
  id: string
  house_id: string
  user_id: string
  status: string
  fixed_amount?: number
  variable_amount?: number
  fines_amount?: number
  period_month: number
  period_year: number
  houses?: House
}

export default function ProofsPage() {
  const [filter, setFilter] = useState<FilterType>("pending")
  const [proofs, setProofs] = useState<Proof[]>([])
  const [houseMap, setHouseMap] = useState<Map<string, string>>(new Map())
  const [residentMap, setResidentMap] = useState<Map<string, string>>(new Map())
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    fetchProofs()
  }, [])

  const fetchProofs = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError("No autenticado")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("condo_id")
        .eq("id", user.id)
        .single()

      if (!profile?.condo_id) {
        setError("Sin condominio asignado")
        return
      }

      // Get currency
      const { data: condo } = await supabase
        .from("condominiums")
        .select("currency_symbol")
        .eq("id", profile.condo_id)
        .single()

      if (condo?.currency_symbol) {
        setCurrencySymbol(condo.currency_symbol)
      }

      // Get houses first to build map
      const { data: houses } = await supabase
        .from("houses")
        .select("id, house_number, number")
        .eq("condo_id", profile.condo_id)

      const map = new Map<string, string>()
      houses?.forEach((house: any) => {
        map.set(house.id, String(house.house_number || house.number))
      })
      setHouseMap(map)

      // Get proofs with house info
      const { data: proofData, error: proofError } = await supabase
        .from("payment_proofs")
        .select(`
          *,
          houses(id, house_number, number)
        `)
        .eq("condo_id", profile.condo_id)
        .order("created_at", { ascending: false })

      if (proofError) {
        setError(`Error al cargar comprobantes: ${proofError.message}`)
        return
      }

      // Get all profiles to map resident names
      const { data: residentsData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("condo_id", profile.condo_id)

      const resMap = new Map<string, string>()
      residentsData?.forEach((resident: any) => {
        resMap.set(resident.id, resident.full_name)
      })
      setResidentMap(resMap)

      setProofs(proofData || [])

      setError("")
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredProofs = filter === "all"
    ? proofs
    : proofs.filter((p) => p.status === filter)

  const counts = {
    pending: proofs.filter((p) => p.status === "pending").length,
    approved: proofs.filter((p) => p.status === "approved").length,
    rejected: proofs.filter((p) => p.status === "rejected").length,
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-6">
        <p className="text-muted-foreground text-center mt-8">Cargando comprobantes...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-lg mx-auto mt-8">
          <div className="p-4 rounded-lg bg-red-100 border border-red-300 text-red-900 dark:bg-red-950 dark:border-red-800 dark:text-red-100">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={fetchProofs} className="mt-4 w-full">
            Reintentar
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Comprobantes de Pago</h1>
            <p className="text-muted-foreground">Revisar y aprobar pagos de residentes</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Por Revisar <Badge className="ml-2">{counts.pending}</Badge>
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
          >
            Aprobados <Badge className="ml-2">{counts.approved}</Badge>
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
          >
            Rechazados <Badge className="ml-2">{counts.rejected}</Badge>
          </Button>
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todos
          </Button>
        </div>

        {/* Proofs Grid */}
        {filteredProofs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProofs.map((proof) => (
              <Link
                key={proof.id}
                href={`/dashboard/comprobantes-pago/${proof.id}`}
                className={`block p-4 rounded-lg transition-all border-2 hover:shadow-md
                  ${proof.status === "pending"
                    ? "border-orange-500 bg-card hover:bg-accent"
                    : proof.status === "approved"
                      ? "border-green-500 bg-card hover:bg-accent"
                      : "border-red-500 bg-card hover:bg-accent"
                  }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">Casa #{proof.houses?.house_number || proof.houses?.number || houseMap.get(proof.house_id) || "?"}</p>
                    <p className="text-xs text-muted-foreground">
                      {residentMap.get(proof.user_id) || "Sin nombre"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(proof.period_year, proof.period_month - 1).toLocaleDateString("es-CL", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={proof.status === "pending" ? "outline" : proof.status === "approved" ? "default" : "destructive"}
                  >
                    {proof.status === "pending"
                      ? "Pendiente"
                      : proof.status === "approved"
                        ? "Aprobado"
                        : "Rechazado"}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <p>Fijo: <span className="font-medium">{currencySymbol}{(proof.fixed_amount || 0).toLocaleString("es-CL")}</span></p>
                  <p>Variable: <span className="font-medium">{currencySymbol}{(proof.variable_amount || 0).toLocaleString("es-CL")}</span></p>
                  <p>Multas: <span className="font-medium">{currencySymbol}{(proof.fines_amount || 0).toLocaleString("es-CL")}</span></p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {filter === "pending" && "No hay comprobantes pendientes de revisar"}
              {filter === "approved" && "No hay comprobantes aprobados"}
              {filter === "rejected" && "No hay comprobantes rechazados"}
              {filter === "all" && "No hay comprobantes"}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
