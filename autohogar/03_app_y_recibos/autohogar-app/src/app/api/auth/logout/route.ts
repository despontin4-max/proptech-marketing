import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Sesión cerrada correctamente.' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al cerrar sesión.' }, { status: 500 });
  }
}
