import { useMemo, useState } from 'react';
import { API_BASE_URL } from '~/config';

interface FaqResult {
  id: number;
  question: string;
  answer: string;
  score: number;
}

interface AskResponse {
  source: 'faq' | 'generated';
  confidence: number;
  answer: string;
  related: Array<{ id: number; question: string; score: number }>;
  created: boolean;
}

export default function FaqAssistant() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FaqResult[]>([]);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => query.trim().length >= 4, [query]);
  const canAsk = useMemo(() => query.trim().length >= 6, [query]);

  const handleSearch = async () => {
    if (!canSearch) return;

    setLoadingSearch(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/search?q=${encodeURIComponent(query.trim())}&limit=6`);
      if (!response.ok) {
        throw new Error('No fue posible buscar en preguntas frecuentes');
      }

      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de busqueda');
      setResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleAsk = async () => {
    if (!canAsk) return;

    setLoadingAsk(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/faq/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query.trim() }),
      });

      if (!response.ok) {
        throw new Error('No fue posible generar una respuesta');
      }

      const data = await response.json();
      setAnswer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al responder');
      setAnswer(null);
    } finally {
      setLoadingAsk(false);
    }
  };

  return (
    <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Centro de Preguntas Frecuentes</h2>
          <p className="text-sm text-slate-600">Busca preguntas relacionadas o recibe una respuesta automatica basada en el banco FAQ.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Escribe tu pregunta..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 focus:border-[#3366CC] focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={!canSearch || loadingSearch}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingSearch ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            onClick={handleAsk}
            disabled={!canAsk || loadingAsk}
            className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-3 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingAsk ? 'Respondiendo...' : 'Responder'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {answer && (
        <div className="mt-5 rounded-2xl border border-[#3366CC]/20 bg-[#3366CC]/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#3366CC]">
            {answer.source === 'faq' ? 'Respuesta desde FAQ' : 'Respuesta generada (nueva FAQ creada)'}
          </p>
          <p className="text-sm leading-relaxed text-slate-700">{answer.answer}</p>
          <p className="mt-2 text-xs text-slate-500">Confianza: {(answer.confidence * 100).toFixed(0)}%</p>

          {answer.related?.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Preguntas relacionadas</p>
              <ul className="space-y-1">
                {answer.related.map((item) => (
                  <li key={item.id} className="text-sm text-slate-700">• {item.question}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Resultados de busqueda</p>
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => {
                  setQuery(result.question);
                  setAnswer({
                    source: 'faq',
                    confidence: result.score,
                    answer: result.answer,
                    related: [],
                    created: false,
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-[#3366CC]/40 hover:bg-[#3366CC]/5"
              >
                <p className="text-sm font-semibold text-slate-900">{result.question}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{result.answer}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
