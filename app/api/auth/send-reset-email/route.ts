import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, resetUrl } = await request.json()

    if (!email || !resetUrl) {
      return NextResponse.json(
        { error: 'Email and resetUrl are required' },
        { status: 400 }
      )
    }

    const result = await resend.emails.send({
      from: 'noreply@administracioncondominio.app',
      to: email,
      subject: 'Recuperar contraseña - InteliCon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Recuperar Contraseña</h2>
          <p>Hola,</p>
          <p>Recibimos una solicitud para recuperar tu contraseña. Haz clic en el botón de abajo para establecer una nueva contraseña:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Recuperar Contraseña
            </a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px;">
            Este enlace expirará en 24 horas.
          </p>
          <p style="color: #999; font-size: 12px;">
            Si no solicitaste este cambio, ignora este correo.
          </p>
        </div>
      `,
    })

    if (result.error) {
      console.error('[v0] Resend error:', result.error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error('[v0] Send reset email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
