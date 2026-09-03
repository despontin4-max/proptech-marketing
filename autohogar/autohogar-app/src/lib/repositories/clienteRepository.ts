/**
 * Repositorio de Clientes — AutoHogar
 * Capa de abstracción sobre Google Sheets con caché en memoria (TTL 30s).
 * Soporta múltiples planes por cliente (relación 1:N).
 */

import { ClientRecord, SheetUser, getMasterClients, getUsersFromSheet } from '@/utils/googleSheets';
import { getHistorialFromSheet } from '@/utils/googleSheets';
import { HistorialPago, calcularResumenFinanciero } from '@/lib/financial/motor';

// ─── Cache en memoria con TTL ─────────────────────────────────────────────────
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const CACHE_TTL_MS = 30_000; // 30 segundos

const cache: { [key: string]: CacheEntry<any> } = {};

function getFromCache<T>(key: string): T | null {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete cache[key];
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, expiresAt: Date.now() + CACHE_TTL_MS };
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    Object.keys(cache).forEach(k => delete cache[k]);
    return;
  }
  Object.keys(cache).filter(k => k.includes(pattern)).forEach(k => delete cache[k]);
}

// ─── Tipos del Repositorio ────────────────────────────────────────────────────

export interface PlanCliente {
  nro_solicitud: string;
  producto: string;
  valor_cuota: number;
  total_cuotas: number;
  fecha_inicio: string;
  estado_plan: string;
}

export interface ClienteConPlanes extends ClientRecord {
  planes: PlanCliente[];
}

export interface ClienteCompleto extends ClienteConPlanes {
  historial: HistorialPago[];
  resumen: ReturnType<typeof calcularResumenFinanciero> | null;
}

// ─── Repositorio Principal ────────────────────────────────────────────────────

/**
 * Obtiene todos los clientes agrupando sus planes (1:N).
 * Usa caché de 30s.
 */
export async function getAllClientes(): Promise<ClienteConPlanes[]> {
  const cacheKey = 'all_clientes';
  const cached = getFromCache<ClienteConPlanes[]>(cacheKey);
  if (cached) return cached;

  const raw = await getMasterClients();

  // Agrupar por ID_CLIENTE (cod)
  const grouped = new Map<string, ClienteConPlanes>();

  for (const r of raw) {
    const cod = String(r.cod || '').trim();
    if (!cod) continue;

    if (!grouped.has(cod)) {
      grouped.set(cod, {
        ...r,
        planes: [],
      });
    }

    const client = grouped.get(cod)!;
    // Cada registro en Clientes_Planes es un plan
    if (r.soli) {
      const planExistente = client.planes.find(p => p.nro_solicitud === String(r.soli));
      if (!planExistente) {
        client.planes.push({
          nro_solicitud: String(r.soli),
          producto: String(r.plan || ''),
          valor_cuota: parseFloat(String(r.amount || '0').replace(',', '.')) || 0,
          total_cuotas: 84, // default: plan estándar 7 años
          fecha_inicio: String(r.dueDate || ''),
          estado_plan: 'ACTIVO',
        });
      }
    }
  }

  const result = Array.from(grouped.values());
  setCache(cacheKey, result);
  return result;
}

/**
 * Busca un cliente por COD con todos sus planes.
 */
export async function getClienteByCod(cod: string): Promise<ClienteConPlanes | null> {
  const all = await getAllClientes();
  return all.find(c => String(c.cod) === cod) || null;
}

/**
 * Obtiene un cliente completo con historial de pagos y resumen financiero.
 */
export async function getClienteCompleto(cod: string, nro_solicitud?: string): Promise<ClienteCompleto | null> {
  const cacheKey = `cliente_completo_${cod}_${nro_solicitud || 'all'}`;
  const cached = getFromCache<ClienteCompleto>(cacheKey);
  if (cached) return cached;

  const cliente = await getClienteByCod(cod);
  if (!cliente) return null;

  // Obtener historial
  const historial = await getHistorialFromSheet(nro_solicitud || String(cliente.soli || ''));

  // Calcular resumen del plan principal (o el solicitado)
  let resumen = null;
  const plan = nro_solicitud
    ? cliente.planes.find(p => p.nro_solicitud === nro_solicitud)
    : cliente.planes[0];

  if (plan) {
    resumen = calcularResumenFinanciero(
      historial,
      plan.valor_cuota,
      plan.fecha_inicio,
      plan.total_cuotas,
    );
  }

  const result: ClienteCompleto = { ...cliente, historial, resumen };
  setCache(cacheKey, result);
  return result;
}

/**
 * Obtiene todos los usuarios del sistema (con caché).
 */
export async function getAllUsuarios(): Promise<SheetUser[]> {
  const cacheKey = 'all_usuarios';
  const cached = getFromCache<SheetUser[]>(cacheKey);
  if (cached) return cached;

  const users = await getUsersFromSheet();
  setCache(cacheKey, users);
  return users;
}
