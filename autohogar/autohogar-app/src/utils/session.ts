/**
 * Shim de compatibilidad: re-exporta verifySessionToken como verifySession.
 * Permite importar desde '@/utils/session' en routes que no necesitan el objeto full.
 */
export { verifySessionToken as verifySession } from '@/lib/auth/session';
export type { SessionUser } from '@/lib/auth/session';
