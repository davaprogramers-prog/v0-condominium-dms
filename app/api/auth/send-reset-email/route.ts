import { Resend } from 'resend'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESENDCONDO_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create Supabase admin client to generate recovery link
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Generate recovery link using Supabase Admin API
    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (linkError || !data) {
      console.error('[v0] Generate recovery link error:', linkError)
      return NextResponse.json(
        { error: 'No se pudo generar el enlace de recuperación' },
        { status: 500 }
      )
    }

    const resetUrl = data.properties?.action_link
    
    // Fix the redirect_to parameter to point to /auth/reset-password
    const fixedResetUrl = resetUrl?.replace(
      `redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}`,
      `redirect_to=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`)}`
    ) || resetUrl

    if (!resetUrl && !fixedResetUrl) {
      console.error('[v0] No recovery link found in data:', data)
      return NextResponse.json(
        { error: 'No se pudo generar el enlace de recuperación' },
        { status: 500 }
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
            <a href="${fixedResetUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Recuperar Contraseña
            </a>
          </p>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #0066cc;">${fixedResetUrl}</p>
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
        { error: 'No se pudo enviar el correo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: result.data?.id })
  } catch (error) {
    console.error('[v0] Send reset email error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
