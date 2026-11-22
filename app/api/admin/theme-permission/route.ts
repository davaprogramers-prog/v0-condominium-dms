import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireGlobalSuperAdmin, respuestaDenegada } from '@/lib/auth/plataforma/guardia'
import { registrarAuditoria } from '@/lib/auth/plataforma/auditoria'

export async function POST(request: NextRequest) {
  try {
    const guardia = await requireGlobalSuperAdmin('condominios.gestionar')
    if (!guardia.ok) return respuestaDenegada(guardia)

    const { adminId, canChangeTheme } = await request.json()

    if (!adminId || typeof adminId !== 'string') {
      return NextResponse.json({ success: false, error: 'Falta el administrador' }, { status: 400 })
    }

    const { error } = await guardia.supabase
      .from('profiles')
      .update({ can_change_theme: canChangeTheme === true })
      .eq('id', adminId)

    if (error) {
      console.error('[plataforma] Error al actualizar permiso de tema:', error.message)
      return NextResponse.json({ success: false, error: 'No se pudo actualizar el permiso' }, { status: 500 })
    }

    await registrarAuditoria({
      actorId: guardia.usuario.id,
      accion: 'administrador.permiso_tema',
      resultado: 'concedido',
      objetivoUserId: adminId,
      motivo: canChangeTheme === true ? 'Permite cambiar tema' : 'Quita cambio de tema',
    })
    revalidatePath('/dashboard/administradores')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[plataforma] theme-permission:', (error as Error).message)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}
