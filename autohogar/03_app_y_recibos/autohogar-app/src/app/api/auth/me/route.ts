import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth/session';
import { getUsersFromSheet } from '@/utils/googleSheets';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Doble verificación en vivo: comprobar si el usuario sigue 'ACTIVO' en la planilla
    const users = await getUsersFromSheet();
    const liveUser = users.find((u) => u.email === session.email);

    if (!liveUser || liveUser.estado !== 'ACTIVO') {
      // Si el dueño lo puso en INACTIVO o lo borró, destruimos la sesión inmediatamente
      await clearSessionCookie();
      return NextResponse.json(
        { authenticated: false, user: null, message: 'Sesión revocada por el administrador.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: liveUser.email,
        nombre: liveUser.nombre,
        rol: liveUser.rol,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al verificar sesión.' }, { status: 500 });
  }
}
