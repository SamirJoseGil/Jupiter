import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '~/config';
import { getHeaders } from '~/utils/auth';

type AdminUser = {
  id: number;
  email: string;
  department?: string | null;
  role: 'admin' | 'superadmin';
  is_active?: boolean;
  created_at?: string;
};

export default function AdminUserManager() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin');
  const [isActive, setIsActive] = useState(true);

  const canCreate = useMemo(() => email.trim().length > 4 && password.trim().length >= 8, [email, password]);
  const canUpdate = useMemo(() => editingId !== null && department.trim().length >= 2, [editingId, department]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No fue posible cargar usuarios');
      }

      const data = await response.json();
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err) {
      setUsers([]);
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setEmail('');
    setPassword('');
    setDepartment('');
    setRole('admin');
    setIsActive(true);
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEmail(user.email);
    setPassword('');
    setDepartment(user.department || '');
    setRole(user.role || 'admin');
    setIsActive(user.is_active !== false);
    setMessage(null);
    setError(null);
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          department: department.trim() || null,
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No se pudo crear el usuario');
      }

      resetForm();
      setMessage('Usuario creado correctamente');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !canUpdate) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload: Record<string, string | boolean> = {
        department: department.trim(),
        role,
        is_active: isActive,
      };

      if (password.trim()) {
        payload.password = password.trim();
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/users/${editingId}`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No se pudo actualizar el usuario');
      }

      setMessage('Usuario actualizado correctamente');
      setPassword('');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error actualizando usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No se pudo desactivar el usuario');
      }

      if (editingId === userId) {
        resetForm();
      }

      setMessage('Usuario desactivado correctamente');
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desactivando usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">Usuarios Administrativos</h2>
        <p className="text-sm text-slate-600">CRUD completo para superadmin: visualización, creación, edición y desactivación.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{editingId ? `Editando usuario #${editingId}` : 'Crear nuevo usuario'}</p>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={editingId !== null}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none disabled:bg-slate-100"
              placeholder="admin@jupiter.gov.co"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Nueva contraseña (opcional)' : 'Contraseña'}
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dependencia</label>
            <input
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
              placeholder="Ej: Infraestructura"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</label>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as 'admin' | 'superadmin')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
              >
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</label>
              <select
                value={isActive ? 'true' : 'false'}
                onChange={(event) => setIsActive(event.target.value === 'true')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {!editingId ? (
              <button
                onClick={handleCreate}
                disabled={saving || !canCreate}
                className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            ) : (
              <button
                onClick={handleUpdate}
                disabled={saving || !canUpdate}
                className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Actualizar usuario'}
              </button>
            )}

            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">Listado de usuarios ({users.length})</p>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No hay usuarios disponibles.</p>
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
              {users.map((user) => (
                <article key={user.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                      <p className="text-xs text-slate-500">{user.department || 'Sin dependencia'}</p>
                    </div>
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        user.role === 'superadmin'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-xs font-semibold ${user.is_active === false ? 'text-red-600' : 'text-emerald-700'}`}>
                      {user.is_active === false ? 'Inactivo' : 'Activo'}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Desactivar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
