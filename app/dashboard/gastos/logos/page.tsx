"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Upload, Loader2, Building2 } from "lucide-react"

interface ExpenseLogo {
  id: string
  name: string
  logo_url: string
  created_at: string
}

export default function ExpenseLogosPage() {
  const [logos, setLogos] = useState<ExpenseLogo[]>([])
  const [loading, setLoading] = useState(true)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [condoId, setCondoId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newLogoName, setNewLogoName] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, condo_id")
      .eq("id", user.id)
      .single()

    if (!profile || !profile.condo_id) {
      router.push("/dashboard")
      return
    }

    const isSuperAdminUser = profile.role === "super_admin"
    setIsSuperAdmin(isSuperAdminUser)
    setCondoId(profile.condo_id)

    if (!isSuperAdminUser) {
      router.push("/dashboard")
      return
    }

    // Get logos without condo_id filter - all logos across all condos
    const { data: logosData } = await supabase
      .from("expense_logos")
      .select("*")
      .is("condo_id", null)
      .order("name")

    setLogos(logosData || [])
    setLoading(false)
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function handleUpload() {
    if (!logoFile || !newLogoName.trim() || !condoId) return

    setUploading(true)
    try {
      const supabase = createClient()

      // Upload logo to storage
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `expense-logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, logoFile)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      // Create expense_logo record (global, not tied to condo)
      const { data: newLogo, error: insertError } = await supabase
        .from("expense_logos")
        .insert({
          condo_id: null,
          name: newLogoName.trim(),
          logo_url: publicUrl
        })
        .select()
        .single()

      if (insertError) throw insertError

      setLogos([...logos, newLogo].sort((a, b) => a.name.localeCompare(b.name)))
      setDialogOpen(false)
      setNewLogoName("")
      setLogoFile(null)
      setLogoPreview(null)
    } catch (error) {
      console.error("Error uploading logo:", error)
      alert("Error al subir el logo")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(logo: ExpenseLogo) {
    if (!confirm(`¿Eliminar el logo "${logo.name}"?`)) return

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("expense_logos")
        .delete()
        .eq("id", logo.id)

      if (error) throw error

      setLogos(logos.filter(l => l.id !== logo.id))
    } catch (error) {
      console.error("Error deleting logo:", error)
      alert("Error al eliminar el logo")
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/gastos">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Logos de Proveedores</h1>
          <p className="text-muted-foreground">Gestiona los logos para identificar gastos</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Logo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Logo de Proveedor</DialogTitle>
              <DialogDescription>
                Sube un logo y asígnale un nombre para identificar gastos
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="logo-name">Nombre del Proveedor</Label>
                <Input
                  id="logo-name"
                  placeholder="Ej: CGE, Lipigas, Tottus..."
                  value={newLogoName}
                  onChange={(e) => setNewLogoName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <Image
                        src={logoPreview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-lg object-contain border bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    >
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG o GIF. Max 2MB
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!logoFile || !newLogoName.trim() || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Subir Logo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {logos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay logos registrados.<br />
              Agrega logos de proveedores para identificar tus gastos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {logos.map((logo) => (
            <div key={logo.id} className="group flex flex-col items-center">
              <div className="relative mb-3">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden shadow-sm border-2 border-muted hover:shadow-md transition-shadow">
                  <Image
                    src={logo.logo_url}
                    alt={logo.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <button
                  onClick={() => handleDelete(logo)}
                  className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-destructive text-white hover:bg-destructive/90 shadow-sm"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <span className="text-sm font-medium text-center truncate w-full px-1">
                {logo.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
