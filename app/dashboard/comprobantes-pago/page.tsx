"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

type FilterType = "pending" | "approved" | "rejected" | "all"

export default function ProofsPage() {
  const [filter, setFilter] = useState<FilterType>("pending")
  const [allProofs, setAllProofs] = useState<any[]>([])
  const [houseMap, setHouseMap] = useState(new Map<string, string>())
  const [currencySymbol, setCurrencySymbol] = useState("$")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("condo_id, role")
          .eq("id", user.id)
          .single()

        if (!profile?.condo_id) return

        // Get condo currency
        const { data: condo } = await supabase
          .from("condominiums")
          .select("currency_symbol")
          .eq("id", profile.condo_id)
          .single()

        setCurrencySymbol(condo?.currency_symbol || "$")

        // Get all payment proofs
        const { data: proofs } = await supabase
          .from("payment_proofs")
          .select("*")
          .eq("condo_id", profile.condo_id)
          .order("created_at", { ascending: false })

        setAllProofs(proofs || [])

        // Get houses
        const { data: houses } = await supabase
          .from("houses")
          .select("*")
          .eq("condo_id", profile.condo_id)

        const newHouseMap = new Map(
          houses?.map((h: any) => [h.id, String(h.house_number || h.number)]) || []
        )
        setHouseMap(newHouseMap)
      } catch (error) {
        console.error("[v0] Error fetching proofs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter proofs based on selected filter
  const filteredProofs = filter === "all"
    ? allProofs
    : allProofs.filter((p) => p.status === filter)

  const pendingCount = allProofs.filter((p) => p.status === "pending").length
  const approvedCount = allProofs.filter((p) => p.status === "approved").length
  const rejectedCount = allProofs.filter((p) => p.status === "rejected").length

  const ProofCard = ({ proof }: { proof: any }) => {
    const borderColor =
      proof.status === "pending"
        ? "border-orange-500 border-2"
        : proof.status === "approved"
          ? "border-green-500 border-2"
          : "border-red-500 border-2"

    return (
      <Link
        href={`/dashboard/comprobantes-pago/${proof.id}`}
        className={`block p-4 rounded-lg ${borderColor} bg-card hover:bg-accent transition-colors`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className="font-medium">Casa #{houseMap.get(proof.house_id)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(proof.period_year, proof.period_month - 1).toLocaleDateString("es-CL", {
                month: "long",
                year: "numeric"
              })}
            </p>
          </div>
          <Badge
            variant={
              proof.status === "pending"
                ? "outline"
                : proof.status === "approved"
                  ? "default"
                  : "destructive"
            }
          >
            {proof.status === "pending"
              ? "Pendiente"
              : proof.status === "approved"
                ? "Aprobado"
                : "Rechazado"}
          </Badge>
        </div>
        <div className="flex gap-4 text-sm">
          <span>
            Fijo: {currencySymbol}
            {(proof.fixed_amount || 0).toLocaleString("es-CL")}
          </span>
          <span>
            Variable: {currencySymbol}
            {(proof.variable_amount || 0).toLocaleString("es-CL")}
          </span>
          <span>
            Multas: {currencySymbol}
            {(proof.fines_amount || 0).toLocaleString("es-CL")}
          </span>
        </div>
      </Link>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <p className="text-muted-foreground">Cargando comprobantes...</p>
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
            className="flex items-center gap-2"
          >
            Por Revisar
            <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
          </Button>
          <Button
            variant={filter === "approved" ? "default" : "outline"}
            onClick={() => setFilter("approved")}
            className="flex items-center gap-2"
          >
            Aprobados
            <Badge variant="secondary" className="ml-1">{approvedCount}</Badge>
          </Button>
          <Button
            variant={filter === "rejected" ? "default" : "outline"}
            onClick={() => setFilter("rejected")}
            className="flex items-center gap-2"
          >
            Rechazados
            <Badge variant="secondary" className="ml-1">{rejectedCount}</Badge>
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
              <ProofCard key={proof.id} proof={proof} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground text-center">
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
