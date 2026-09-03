'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UsersAdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    rol: 'recepcion',
    password: '',
    estado: 'ACTIVO'
  });
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.status === 401 || res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Error al cargar usuarios');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        alert(data.error || 'Error al guardar el usuario');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${email}?`)) return;
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const openModal = (user: any = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        password: '', // No mostramos la actual, solo si quieren cambiarla
        estado: user.estado || 'ACTIVO'
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        nombre: '',
        rol: 'recepcion',
        password: '',
        estado: 'ACTIVO'
      });
    }
    setShowModal(true);
  };

  if (loading) return <div className="p-8 text-center text-white">Cargando panel de usuarios...</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-white/5">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Gestión de Usuarios
            </h1>
            <p className="text-gray-400 mt-2">Administra los accesos de tus empleados.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all font-medium">
              Volver al Inicio
            </Link>
            <button 
              onClick={() => openModal()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl">{error}</div>}

        <div className="bg-[#1e293b] rounded-2xl shadow-xl border border-white/5 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/50 text-gray-400 text-sm">
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Rol</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map(user => (
                <tr key={user.email} className="hover:bg-gray-800/30 transition-colors">
                  <td className="p-4">{user.nombre}</td>
                  <td className="p-4 text-gray-300">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.rol === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.estado === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {user.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(user)} className="text-blue-400 hover:text-blue-300 transition-colors">Editar</button>
                    {user.email !== 'despontin4@gmail.com' && (
                       <button onClick={() => handleDelete(user.email)} className="text-red-400 hover:text-red-300 transition-colors">Eliminar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
              <h2 className="text-2xl font-bold mb-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre</label>
                  <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input type="email" required disabled={!!editingUser} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Rol</label>
                  <select value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="recepcion">Recepción (Solo rellenar nombre)</option>
                    <option value="cobranzas">Cobranzas (Solo rellenar nombre)</option>
                    <option value="ADMIN">Administrador (Verificar y gestionar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña {editingUser && '(Dejar en blanco para no cambiar)'}</label>
                  <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Estado</label>
                    <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-700 hover:bg-gray-600 transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
