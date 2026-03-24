import { signup } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Crear Cuenta</CardTitle>
          <CardDescription>Reg&iacute;strate para administrar o participar en tu condominio</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{params.error}</div>
          )}
          <form className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="first_name">Nombre</Label>
                <Input id="first_name" name="first_name" placeholder="Juan" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="last_name">Apellido</Label>
                <Input id="last_name" name="last_name" placeholder="P&eacute;rez" required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electr&oacute;nico</Label>
              <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrase&ntilde;a</Label>
              <Input id="password" name="password" type="password" placeholder="M&iacute;nimo 6 caracteres" required minLength={6} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="role">Tipo de cuenta</Label>
              <Select name="role" defaultValue="owner">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button formAction={signup} className="w-full">
              Crear Cuenta
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {"&iquest;Ya tienes cuenta? "}
            <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
              Inicia sesi&oacute;n
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
