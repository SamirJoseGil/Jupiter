import { useState } from 'react';
import { API_BASE_URL } from '~/config';

type StatusPayload = {
  tracking: number;
  status: string;
  channel: string;
  classification?: string | null;
  assigned_department?: string | null;
  created_at: string;
  updated_at?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  analyzed: 'Analizada',
  assigned: 'Asignada',
  resolved: 'Resuelta',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  analyzed: 'border-blue-200 bg-blue-50 text-blue-800',
  assigned: 'border-indigo-200 bg-indigo-50 text-indigo-800',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const CHANNEL_LABELS: Record<string, string> = {
  web: 'Formulario web',
  email: 'Correo',
  chat: 'Chat',
  phone: 'Telefónico',
  social: 'Redes sociales',
  'official-web': 'Jupiter',
  'official-whatsapp': 'Flor IA por WhatsApp',
  'official-ai': 'Flor IA',
  'official-email': 'Correo oficial',
  'official-phone': 'Línea oficial',
};

const toStatusLabel = (status?: string) => {
  const key = String(status || '').toLowerCase();
  return STATUS_LABELS[key] || status || 'Sin estado';
};

const toStatusStyle = (status?: string) => {
  const key = String(status || '').toLowerCase();
  return STATUS_STYLES[key] || 'border-slate-200 bg-slate-50 text-slate-700';
};

const toChannelLabel = (channel?: string) => {
  const key = String(channel || '').toLowerCase();
  return CHANNEL_LABELS[key] || channel || 'No definido';
};

function PqrsStatusCheck() {
  const [trackingId, setTrackingId] = useState('');
  const [cc, setCc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<StatusPayload | null>(null);

  const consult = async () => {
    if (!trackingId.trim()) {
      setError('Ingresa un numero de radicado.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const query = cc.trim() ? `?cc=${encodeURIComponent(cc.trim())}` : '';
      const response = await fetch(`${API_BASE_URL}/api/pqrs-status/${encodeURIComponent(trackingId.trim())}${query}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || 'No se pudo consultar el estado.');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el estado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">Consultar estado de PQRSDF</h3>
      <p className="mt-1 text-sm text-slate-600">Ingresa el radicado y, opcionalmente, la c.c para validar el estado actual.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          value={trackingId}
          onChange={(event) => setTrackingId(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              consult();
            }
          }}
          placeholder="Radicado"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
        />
        <input
          value={cc}
          onChange={(event) => setCc(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              consult();
            }
          }}
          placeholder="C.C (opcional)"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
        />
        <button
          type="button"
          onClick={consult}
          disabled={loading}
          className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-3 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:opacity-60"
        >
          {loading ? 'Consultando...' : 'Consultar estado'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resultado de consulta</p>
              <p className="text-xl font-black text-slate-900">Radicado #{result.tracking}</p>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toStatusStyle(result.status)}`}>
              {toStatusLabel(result.status)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Canal</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{toChannelLabel(result.channel)}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Clasificación</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{result.classification || 'Sin clasificar'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dependencia</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{result.assigned_department || 'Sin asignar'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 sm:col-span-2 lg:col-span-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Fechas</p>
              <p className="mt-1 text-sm text-slate-700">
                Creada: <span className="font-semibold text-slate-900">{new Date(result.created_at).toLocaleString('es-CO')}</span>
              </p>
              {result.updated_at && (
                <p className="mt-1 text-sm text-slate-700">
                  Última actualización: <span className="font-semibold text-slate-900">{new Date(result.updated_at).toLocaleString('es-CO')}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export { PqrsStatusCheck };
export default PqrsStatusCheck;
