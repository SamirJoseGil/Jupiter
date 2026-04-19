import { useEffect, useState } from 'react';
import { API_BASE_URL } from '~/config';
import { getHeaders } from '~/utils/auth';

type TemplatePayload = {
  name: string;
  body: string;
};

export default function AdminResponseTemplate() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [guidelines, setGuidelines] = useState('');
  const [template, setTemplate] = useState<TemplatePayload>({
    name: 'Plantilla institucional',
    body: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/responses/templates`, {
          headers: getHeaders(),
        });

        if (!response.ok) return;
        const data = await response.json();
        setGuidelines(data.context || '');
        setTemplate({
          name: data.active?.name || 'Plantilla institucional',
          body: data.active?.body || '',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const save = async () => {
    try {
      setSaving(true);
      setMessage('');
      const response = await fetch(`${API_BASE_URL}/api/responses/templates`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(template),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'No se pudo guardar la plantilla');
      }

      setMessage('Plantilla actualizada correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar la plantilla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Módulo de respuestas IA</h2>
      <p className="mt-1 text-sm text-slate-600">Edita la respuesta predeterminada que se autoguarda como borrador para cada PQRSDF.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="template-name" className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label>
          <input
            id="template-name"
            value={template.name}
            onChange={(event) => setTemplate((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3366CC] focus:outline-none"
          />

          <label htmlFor="template-body" className="mb-2 mt-4 block text-sm font-semibold text-slate-700">Plantilla</label>
          <textarea
            id="template-body"
            value={template.body}
            onChange={(event) => setTemplate((current) => ({ ...current, body: event.target.value }))}
            rows={12}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#3366CC] focus:outline-none"
          />
          <p className="mt-2 text-xs text-slate-500">
            Variables: {'{{RADICADO}}'}, {'{{DEPENDENCIA}}'}, {'{{ESTADO}}'}, {'{{RESUMEN_CASO}}'}
          </p>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="mt-4 rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar plantilla'}
          </button>

          {message && <p className="mt-3 text-sm text-slate-700">{message}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Base normativa usada por IA</p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
            {guidelines || 'Cargando contexto institucional...'}
          </p>
        </div>
      </div>
    </section>
  );
}
