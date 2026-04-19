import { useEffect, useState } from 'react';
import { API_BASE_URL } from '~/config';
import { getHeaders } from '~/utils/auth';

type RelationItem = {
  source_pqr_id: number;
  related_pqr_id: number;
  score: number;
  status?: string;
  classification?: string;
};

export default function AdminPqrRelations({ pqrId }: { pqrId: number }) {
  const [items, setItems] = useState<RelationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqrId}/relations`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'No se pudieron cargar relaciones');
      }
      setItems(Array.isArray(data.relations) ? data.relations : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudieron cargar relaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [pqrId]);

  const rebuild = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqrId}/relations/rebuild`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'No se pudo recalcular');
      }
      setItems(Array.isArray(data.relations) ? data.relations : []);
      setMessage('Relaciones recalculadas correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo recalcular');
    } finally {
      setLoading(false);
    }
  };

  const removeRelation = async (relatedId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqrId}/relations/${relatedId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'No se pudo eliminar relación');
      }
      setItems((current) => current.filter((item) => item.related_pqr_id !== relatedId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo eliminar relación');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Gestión de PQRSDF relacionadas</h3>
          <p className="text-xs text-slate-500">Relaciones automáticas almacenadas en base de datos.</p>
        </div>
        <button
          type="button"
          onClick={rebuild}
          disabled={loading}
          className="rounded-lg border border-[#3366CC]/25 bg-[#3366CC]/10 px-3 py-2 text-xs font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:opacity-60"
        >
          {loading ? 'Procesando...' : 'Recalcular'}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">No hay relaciones registradas para esta solicitud.</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.related_pqr_id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div>
                <p className="font-semibold text-slate-800">Relacionada #{item.related_pqr_id}</p>
                <p className="text-xs text-slate-600">Score: {item.score} · Estado: {item.status || 'N/D'} · Clase: {item.classification || 'N/D'}</p>
              </div>
              <button
                type="button"
                onClick={() => removeRelation(item.related_pqr_id)}
                className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}

      {message && <p className="mt-2 text-xs text-slate-600">{message}</p>}
    </section>
  );
}
