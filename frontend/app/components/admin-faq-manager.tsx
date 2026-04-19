import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '~/config';
import { getHeaders } from '~/utils/auth';

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  usage_count?: number;
};

export default function AdminFaqManager() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [keywordText, setKeywordText] = useState('');

  const canSubmit = useMemo(() => question.trim().length >= 6 && answer.trim().length >= 10, [question, answer]);

  const loadFaqs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/faq?limit=200`);
      if (!response.ok) {
        throw new Error('No fue posible cargar FAQ');
      }
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];
      setFaqs(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando FAQ');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setKeywordText('');
  };

  const parseKeywords = () =>
    keywordText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        keywords: parseKeywords(),
      };

      const response = await fetch(
        editingId ? `${API_BASE_URL}/api/faq/${editingId}` : `${API_BASE_URL}/api/faq`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            ...getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No se pudo guardar FAQ');
      }

      setMessage(editingId ? 'FAQ actualizada correctamente' : 'FAQ creada correctamente');
      resetForm();
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setKeywordText('');
    setMessage(null);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      setMessage(null);
      const response = await fetch(`${API_BASE_URL}/api/faq/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || 'No se pudo eliminar FAQ');
      }

      if (editingId === id) {
        resetForm();
      }

      setMessage('FAQ eliminada correctamente');
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando FAQ');
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Administrador de FAQ</h2>
          <p className="text-sm text-slate-600">Crea, edita y elimina preguntas frecuentes manualmente.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {editingId ? `Editando FAQ #${editingId}` : 'Nueva FAQ'}
          </p>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pregunta</label>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ej: Como consultar mi radicado?"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Respuesta</label>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={5}
              placeholder="Escribe la respuesta orientativa para el ciudadano..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Palabras clave (opcional)</label>
            <input
              value={keywordText}
              onChange={(event) => setKeywordText(event.target.value)}
              placeholder="radicado, estado, seguimiento"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={saving || !canSubmit}
              className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editingId ? 'Actualizar FAQ' : 'Crear FAQ'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar edicion
              </button>
            )}
          </div>

          {message && <p className="text-sm text-emerald-700">{message}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-slate-800">FAQ existentes ({faqs.length})</p>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando FAQ...</p>
          ) : faqs.length === 0 ? (
            <p className="text-sm text-slate-500">No hay FAQ registradas.</p>
          ) : (
            <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
              {faqs.map((faq) => (
                <article key={faq.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{faq.answer}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Usos: {faq.usage_count ?? 0}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        Eliminar
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
