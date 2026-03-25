import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl text-balance">Revisa tu correo</CardTitle>
          <CardDescription>
            Hemos enviado un enlace de confirmaci&oacute;n a tu correo electr&oacute;nico. Por favor, verifica tu cuenta para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/auth/login">Volver al inicio de sesi&oacute;n</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
