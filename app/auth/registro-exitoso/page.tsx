import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export const metadata: Metadata = {
  title: 'Registro Exitoso | InteliCon',
  description: 'Tu registro ha sido completado exitosamente. Por favor confirma tu email.',
}

export const revalidate = 3600 // Static page, revalidate every hour

export default function RegistroExitosoPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-chart-2/20">
            <MailCheck className="h-7 w-7 text-chart-2" />
          </div>
          <CardTitle className="text-2xl font-bold text-balance">Registro Exitoso</CardTitle>
          <CardDescription className="text-pretty">
            Hemos enviado un correo de confirmación a tu dirección de email. 
            Por favor revisa tu bandeja de entrada y confirma tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/login">Ir a Iniciar Sesión</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
