import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // TODO: Reemplaza esto con la URL real del APK
    // Opciones:
    // 1. Usar Vercel Blob para almacenar el APK
    // 2. Usar Google Drive o Dropbox para almacenar el APK
    // 3. Usar un servidor S3 o similar
    
    const APK_URL = process.env.ANDROID_APK_URL

    if (!APK_URL) {
      return NextResponse.json(
        { error: 'APK URL no configurada. Por favor, configura ANDROID_APK_URL en las variables de entorno.' },
        { status: 500 }
      )
    }

    // Hacer fetch del APK desde la URL configurada
    const response = await fetch(APK_URL)
    
    if (!response.ok) {
      throw new Error(`Error descargando APK: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="intelicon-app.apk"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error en descarga de APK:', error)
    return NextResponse.json(
      { error: 'Error al descargar la aplicación' },
      { status: 500 }
    )
  }
}
