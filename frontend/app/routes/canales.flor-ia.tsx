import { Link } from '@remix-run/react';

export default function FlorIAFallbackPage() {
  const whatsappUrl = import.meta.env.VITE_FLOR_IA_WHATSAPP_URL || 'https://wa.me/573044444144';

  return (
    <main className="min-h-screen bg-white px-4 py-12 text-slate-900 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3366CC]">Canal alterno</p>
        <h1 className="mt-2 text-3xl font-black">Flor IA por WhatsApp</h1>
        <p className="mt-3 text-slate-600">
          Si el enlace principal no está disponible, puedes usar este fallback para continuar la atención en el canal de WhatsApp.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-5 py-3 font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15"
          >
            Abrir Flor IA en WhatsApp
          </a>
          <Link
            to="/user"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver a PQRSDF
          </Link>
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Si no abre automáticamente, copia y pega este enlace en tu navegador: {whatsappUrl}
        </p>
      </div>
    </main>
  );
}
