import { NextResponse } from 'next/server';
import { getUsersFromSheet } from '@/utils/googleSheets';
import { setSessionCookie } from '@/lib/auth/session';

// Rate limiter en memoria para prevenir ataques de fuerza bruta
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000; // 15 minutos

function isRateLimited(ip: string): boolean {
  const record = loginAttempts.get(ip);
  if (!record) return false;

  if (Date.now() - record.lastAttempt > LOCKOUT_TIME_MS) {
    loginAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string) {
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(ip, record);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Demasiados intentos fallidos. Por seguridad, espera 15 minutos.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Debe ingresar email y contraseña.' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password).trim();

    // 1. Obtener usuarios vigentes directamente desde la pestaña 'Usuarios'
    const users = await getUsersFromSheet();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user || user.password !== cleanPassword) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: 'Credenciales inválidas. Verifique su email y contraseña.' },
        { status: 401 }
      );
    }

    // 2. Comprobar si el usuario fue revocado / desactivado
    if (user.estado !== 'ACTIVO') {
      return NextResponse.json(
        { error: 'Tu acceso ha sido desactivado por la administración.' },
        { status: 403 }
      );
    }

    // 3. Login exitoso: limpiar intentos fallidos y emitir cookie HttpOnly
    clearAttempts(ip);

    const sessionUser = {
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json({
      success: true,
      user: sessionUser,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar el inicio de sesión.' },
      { status: 500 }
    );
  }
}
