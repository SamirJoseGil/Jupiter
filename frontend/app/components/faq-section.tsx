import { useEffect, useState } from 'react';
import { API_BASE_URL } from '~/config';

type FAQItem = {
  id: number;
  question: string;
  answer: string;
};

const FALLBACK_FAQS: FAQItem[] = [
  {
    id: 1,
    question: 'Como radico una solicitud en Jupiter?',
    answer: 'Ingresa al formulario ciudadano, describe tu caso con claridad y selecciona el canal correspondiente. Al finalizar, el sistema registra la solicitud para su seguimiento.'
  },
  {
    id: 2,
    question: 'Que informacion debo incluir para una mejor atencion?',
    answer: 'Incluye ubicacion exacta, fecha aproximada, descripcion detallada y, si es posible, evidencia de soporte como fotografias o referencias.'
  },
  {
    id: 3,
    question: 'Como se determina la dependencia responsable?',
    answer: 'El sistema analiza el contenido de la solicitud y sugiere una clasificacion inicial para orientar la asignacion administrativa correspondiente.'
  },
  {
    id: 4,
    question: 'Cuanto tarda la respuesta?',
    answer: 'El tiempo depende del tipo de caso y su complejidad. Se recomienda conservar el numero de radicado para consultar avances y evitar duplicados.'
  }
];

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>(FALLBACK_FAQS);
  const [openId, setOpenId] = useState<number | null>(FALLBACK_FAQS[0]?.id ?? null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/faq?limit=8`);
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (Array.isArray(data.results) && data.results.length > 0) {
          setFaqs(data.results);
          setOpenId(data.results[0].id);
        }
      } catch {
        // Keep fallback FAQs on fetch failure.
      }
    };

    fetchFaqs();
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredFaqs = normalizedSearch
    ? faqs.filter((item) =>
        `${item.question} ${item.answer}`.toLowerCase().includes(normalizedSearch)
      )
    : faqs;

  return (
    <section id="faq" className="min-h-screen bg-white px-4 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#3366CC]">Atencion Ciudadana</p>
          <h2 className="mt-3 text-4xl font-black text-slate-900 sm:text-5xl">Preguntas Frecuentes</h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            Consulta respuestas orientativas sobre el proceso de radicacion, seguimiento y gestion de solicitudes.
          </p>

          <div className="mt-6">
            <label htmlFor="faq-search" className="mb-2 block text-sm font-semibold text-slate-700">
              Buscar en preguntas frecuentes
            </label>
            <input
              id="faq-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej: tiempos de respuesta, radicado, dependencia..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#3366CC] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((item) => {
            const isOpen = openId === item.id;

            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base font-semibold text-slate-900 sm:text-lg">{item.question}</span>
                  <span className="text-xl font-light text-[#3366CC]">{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    <p className="text-sm leading-relaxed text-slate-700 sm:text-base">{item.answer}</p>
                  </div>
                )}
              </article>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-600">
              No encontramos resultados con "{search}". Intenta con otra palabra clave.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
