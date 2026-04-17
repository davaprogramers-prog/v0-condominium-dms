import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { name, email, phone, condominio, type, message } = data

    // Validar datos requeridos
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      )
    }

    // Aquí irá la lógica para enviar el email
    // Por ahora, solo simulamos una respuesta exitosa
    // En el futuro, integraremos con un servicio de email como SendGrid, Resend, etc.

    console.log('[v0] Formulario de contacto recibido:', {
      name,
      email,
      phone,
      condominio,
      type,
      message,
      receivedAt: new Date().toISOString()
    })

    // Simular envío exitoso
    // TODO: Implementar envío real de email a publicidad@dmsinnova.cl
    return NextResponse.json(
      { 
        success: true,
        message: 'Tu mensaje ha sido registrado y será procesado por nuestro equipo'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error en contacto:', error)
    return NextResponse.json(
      { error: 'Error al procesar tu solicitud' },
      { status: 500 }
    )
  }
}
