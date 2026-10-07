import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, clearSessionCookie } from '@/lib/auth/session';
import { getUsersFromSheet } from '@/utils/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get('ah_session')?.value ||
      request.headers.get('authorization')?.replace(/Bearer\s+/i, '').trim() ||
      request.headers.get('x-session-token')?.trim();

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const session = verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Comprobar si el usuario fue explícitamente revocado en la planilla (sin destruir sesión por errores de red)
    try {
      const users = await getUsersFromSheet();
      const liveUser = users.find(
        (u) => u.email.toLowerCase().trim() === session.email.toLowerCase().trim()
      );

      if (liveUser && liveUser.estado === 'INACTIVO') {
        await clearSessionCookie();
        return NextResponse.json(
          { authenticated: false, user: null, message: 'Sesión revocada por el administrador.' },
          { status: 403 }
        );
      }
    } catch (sheetErr) {
      // Si la planilla no responde o tiene latencia, se mantiene la sesión firmada válida
      console.warn('[/api/auth/me] Fallback a sesión criptográfica válida:', sheetErr);
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.email,
        nombre: session.nombre,
        rol: session.rol,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al verificar sesión.' }, { status: 500 });
  }
}
