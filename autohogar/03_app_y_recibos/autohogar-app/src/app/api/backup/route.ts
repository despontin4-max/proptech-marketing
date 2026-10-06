import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';
import { getMasterClients } from '@/utils/googleSheets';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/backup
 * Genera un backup JSON de la base de datos maestra.
 * Solo accesible para admin/supervisor.
 * Diseñado para ser llamado por un cron job diario.
 */
export async function POST(request: Request) {
  // Verificar sesión o clave de cron
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;

  // Permitir también acceso con clave secreta de cron (para GitHub Actions / Vercel Cron)
  const cronKey = request.headers.get('x-cron-key');
  const isAuthorizedCron = cronKey && cronKey === process.env.BACKUP_CRON_KEY;

  if (!session && !isAuthorizedCron) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (session && session.rol !== 'admin' && session.rol !== 'supervisor') {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const clientes = await getMasterClients();

    const backupDir = path.join(process.cwd(), 'public', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Nombre del archivo con timestamp
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup_${ts}.json`;
    const filePath = path.join(backupDir, fileName);

    const backupData = {
      timestamp: now.toISOString(),
      totalRegistros: clientes.length,
      generadoPor: session?.nombre || 'cron-job',
      datos: clientes,
    };

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    // Mantener solo los últimos 7 backups
    const allBackups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (allBackups.length > 7) {
      allBackups.slice(7).forEach(old => {
        try { fs.unlinkSync(path.join(backupDir, old)); } catch {}
      });
    }

    return NextResponse.json({
      success: true,
      archivo: `/backups/${fileName}`,
      registros: clientes.length,
      timestamp: now.toISOString(),
    });

  } catch (error: any) {
    console.error('Error generando backup:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}

/**
 * GET /api/backup — lista los backups disponibles (solo admin)
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;

  if (!session || (session.rol !== 'admin' && session.rol !== 'supervisor')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const backupDir = path.join(process.cwd(), 'public', 'backups');
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json({ success: true, backups: [] });
    }

    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
      .sort()
      .reverse()
      .map(f => ({
        nombre: f,
        url: `/backups/${f}`,
        tamaño: fs.statSync(path.join(backupDir, f)).size,
      }));

    return NextResponse.json({ success: true, backups });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
