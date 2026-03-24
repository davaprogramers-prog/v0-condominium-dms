import { login } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2 } from "lucide-react"
import Link from "next/link"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <Building2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">CondoAdmin</CardTitle>
          <CardDescription>Ingresa a tu cuenta para administrar tu condominio</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{params.error}</div>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electr&oacute;nico</Label>
              <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrase&ntilde;a</Label>
              <Input id="password" name="password" type="password" placeholder="Tu contrase&ntilde;a" required />
            </div>
            <Button formAction={login} className="w-full">
              Iniciar Sesi&oacute;n
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {"&iquest;No tienes cuenta? "}
            <Link href="/auth/registro" className="text-primary underline-offset-4 hover:underline">
              Reg&iacute;strate aqu&iacute;
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
