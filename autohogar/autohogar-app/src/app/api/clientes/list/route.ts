import { NextResponse } from 'next/server';
import { getMasterClients } from '@/utils/googleSheets';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const clientes = await getMasterClients();
    
    if (!clientes || clientes.length === 0) {
      return NextResponse.json({ success: true, clientes: [], headers: [] });
    }

    // Adaptamos al formato que espera el Dashboard
    const formattedClients = clientes.map((client, index) => ({
      ...client,
      sheetRowIndex: index + 2, // Para actualizar 1_CLIENTES después si es necesario
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
