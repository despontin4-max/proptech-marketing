import { NextResponse } from 'next/server';
import { getMasterClients } from '@/utils/googleSheets';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.has('t');

  try {
    const clientes = await getMasterClients(forceRefresh);
    
    if (!clientes || clientes.length === 0) {
      return NextResponse.json({ success: true, clientes: [], headers: [] });
    }

    // Adaptamos al formato que espera el Dashboard manteniendo el sheetRowIndex real
    const formattedClients = clientes.map((client, index) => ({
      ...client,
      sheetRowIndex: client.sheetRowIndex || index + 2,
    }));

    return NextResponse.json({
      success: true,
      total: formattedClients.length,
      headers: Object.keys(formattedClients[0] || {}), // Opcional, el dashboard lo usa poco
      clientes: formattedClients,
    });

  } catch (error: any) {
    console.error('[/api/clientes/list]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
