import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';
import { getAllClientes, getClienteCompleto } from '@/lib/repositories/clienteRepository';

/**
 * GET /api/clientes
 * Query params:
 *   - cod: buscar cliente específico por código
 *   - nro_solicitud: incluir resumen financiero de esta solicitud
 *   - all: devolver lista completa (solo admin)
 */
export async function GET(request: Request) {
  // Verificar sesión
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cod = searchParams.get('cod');
  const nro_solicitud = searchParams.get('nro_solicitud') || undefined;
  const all = searchParams.get('all') === 'true';

  try {
    if (cod) {
      // Búsqueda individual con resumen financiero
      const cliente = await getClienteCompleto(cod, nro_solicitud);
      if (!cliente) {
        return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, cliente });
    }

    if (all) {
      // Solo admin puede listar todos
      if (session.rol !== 'admin' && session.rol !== 'supervisor') {
        return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
      }
      const clientes = await getAllClientes();
      return NextResponse.json({ success: true, total: clientes.length, clientes });
    }

    return NextResponse.json({ error: 'Debe especificar ?cod=XXX o ?all=true' }, { status: 400 });

  } catch (error: any) {
    console.error('Error en /api/clientes:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
