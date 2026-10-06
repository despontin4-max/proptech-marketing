import { cookies } from 'next/headers';
import crypto from 'crypto';

const COOKIE_NAME = 'ah_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'autohogar-super-secret-key-production-2026';

export interface SessionUser {
  email: string;
  nombre: string;
  rol: string;
}

interface EncryptedPayload extends SessionUser {
  exp: number; // Timestamp de expiración
  iat: number; // Timestamp de emisión
}

/**
 * Firma y encripta el token de sesión usando HMAC SHA-256
 */
export function signSessionToken(user: SessionUser): string {
  const payload: EncryptedPayload = {
    ...user,
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 10, // 10 horas (jornada laboral)
  };

  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(dataStr)
    .digest('base64url');

  return `${dataStr}.${signature}`;
}

/**
 * Verifica la firma y vigencia del token de sesión
 */
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [dataStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(dataStr)
      .digest('base64url');

    // Comparación en tiempo constante para evitar Timing Attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: EncryptedPayload = JSON.parse(
      Buffer.from(dataStr, 'base64url').toString('utf8')
    );

    // Verificar si expiró
    if (Date.now() > payload.exp) {
      return null;
    }

    return {
      email: payload.email,
      nombre: payload.nombre,
      rol: payload.rol,
    };
  } catch {
    return null;
  }
}

/**
 * Guarda la cookie de sesión HttpOnly segura
 */
export async function setSessionCookie(user: SessionUser) {
  const token = signSessionToken(user);
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true, // Inaccesible desde JavaScript del navegador (anti-XSS)
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Protección anti-CSRF
    maxAge: 60 * 60 * 10, // 10 horas
    path: '/',
  });
}

/**
 * Obtiene la sesión actual desde la cookie HttpOnly
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Elimina la cookie de sesión (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
