import { NextResponse } from 'next/server';
import { getLocalUsers, saveLocalUsers, SheetUser } from '@/utils/googleSheets';
import { getSession } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const users = getLocalUsers();
    // No enviar passwords al frontend por seguridad
    const safeUsers = users.map(u => {
      const { password, ...safeUser } = u;
      return safeUser;
    });

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { email, nombre, rol, password, estado } = await request.json();
    if (!email || !nombre || !rol || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const users = getLocalUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const newUser: SheetUser = {
      email: email.toLowerCase(),
      nombre,
      rol,
      password,
      estado: estado || 'ACTIVO',
    };

    users.push(newUser);
    saveLocalUsers(users);

    return NextResponse.json({ success: true, user: { email, nombre, rol, estado } });
  } catch (error) {
    console.error('POST user error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { email, nombre, rol, password, estado } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Falta email' }, { status: 400 });
    }

    const users = getLocalUsers();
    const userIndex = users.findIndex(u => u.email === email.toLowerCase());
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const user = users[userIndex];
    if (nombre) user.nombre = nombre;
    if (rol) user.rol = rol;
    if (password) user.password = password; // Permitir cambio de clave
    if (estado) user.estado = estado;

    users[userIndex] = user;
    saveLocalUsers(users);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.rol !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Falta email' }, { status: 400 });
    }

    const users = getLocalUsers();
    const updatedUsers = users.filter(u => u.email !== email.toLowerCase());
    
    if (users.length === updatedUsers.length) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    saveLocalUsers(updatedUsers);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
