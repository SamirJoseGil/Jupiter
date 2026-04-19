import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "@remix-run/react";
import AdminLayout from "~/components/admin-layout";
import { API_BASE_URL } from "~/config";
import { getAvatarSrc, getHeaders, getStoredUser, updateStoredUser } from "~/utils/auth";

const MAX_AVATAR_SIZE = 20 * 1024 * 1024;

type ProfileFormState = {
  department: string;
  avatarBase64: string;
  avatarMimeType: string;
};

export default function AdminAccountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAvatarPreview, setCurrentAvatarPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileFormState>({
    department: "",
    avatarBase64: "",
    avatarMimeType: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: getHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate("/admin/login");
            return;
          }
          throw new Error("No se pudo cargar la cuenta");
        }

        const data = await response.json();
        const user = data.user;
        const storedAvatar = getAvatarSrc(user);

        setProfile({
          department: user?.department || "",
          avatarBase64: "",
          avatarMimeType: "",
        });
        setCurrentAvatarPreview(storedAvatar);
        updateStoredUser(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cargar la cuenta");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const initials = useMemo(() => {
    const storedUser = getStoredUser();
    if (!storedUser?.email) return "AD";
    return storedUser.email.slice(0, 2).toUpperCase();
  }, []);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("La imagen debe ser un archivo válido de tipo imagen.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("La imagen no puede superar 20 MB.");
      event.target.value = "";
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
      reader.readAsDataURL(file);
    });

    setError(null);
    setProfile((current) => ({
      ...current,
      avatarBase64: dataUrl,
      avatarMimeType: file.type,
    }));
    setCurrentAvatarPreview(dataUrl);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: Record<string, string> = {};

      if (profile.department.trim()) {
        payload.department = profile.department.trim();
      }

      if (profile.avatarBase64) {
        payload.avatarBase64 = profile.avatarBase64;
        payload.avatarMimeType = profile.avatarMimeType;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me/profile`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "No se pudo actualizar la cuenta");
      }

      updateStoredUser(data.user);
      setMessage("Cuenta actualizada correctamente.");
      setProfile((current) => ({
        ...current,
        department: data.user.department || current.department,
        avatarBase64: "",
        avatarMimeType: "",
      }));
      setCurrentAvatarPreview(getAvatarSrc(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cuenta");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Administración</p>
          <h1 className="text-3xl font-black text-slate-900">Mi cuenta</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Actualiza la información visible de tu cuenta y la imagen de perfil institucional.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-[#3366CC]/10 text-2xl font-black text-[#3366CC]">
                {currentAvatarPreview ? (
                  <img src={currentAvatarPreview} alt="Avatar actual" className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Cuenta administrativa</h2>
              <p className="text-sm text-slate-500">Solo acceso interno</p>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-slate-500">Correo</dt>
                <dd className="mt-1 font-semibold text-slate-900">{getStoredUser()?.email}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <dt className="text-slate-500">Departamento</dt>
                <dd className="mt-1 font-semibold text-slate-900">{getStoredUser()?.department || "Sin asignar"}</dd>
              </div>
            </dl>
          </aside>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="department">
                  Dependencia
                </label>
                <input
                  id="department"
                  value={profile.department}
                  onChange={(event) => setProfile((current) => ({ ...current, department: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#3366CC] focus:ring-2 focus:ring-[#3366CC]/20"
                  placeholder="Ej. Infraestructura, Salud, Movilidad"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="avatar">
                  Imagen de perfil
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-[#3366CC]/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#3366CC]"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Formatos permitidos: imagen. Tamaño máximo: 20 MB.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                La imagen se almacena en base64 dentro del perfil del administrador para reutilizarla en el panel.
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="rounded-2xl border border-[#3366CC]/25 bg-[#3366CC] px-6 py-3 font-semibold text-white transition hover:bg-[#2857b3] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin-dashboard')}
                  className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Volver al panel
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
