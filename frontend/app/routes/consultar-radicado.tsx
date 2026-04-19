import { Link } from '@remix-run/react';
import Navbar from '~/components/navbar';
import Footer from '~/components/footer';
import { PqrsStatusCheck } from '~/components/pqrs-status-check';

export default function ConsultarRadicadoPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main id="main-content" className="px-4 py-12 sm:px-8 lg:px-12 min-h-screen">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>

          <h1 className="text-4xl font-black text-slate-900">Consultar Radicado</h1>
          <p className="mt-2 text-slate-600">Consulta el estado de tu PQRSDF por numero de radicado.</p>

          <div className="mt-8">
            <PqrsStatusCheck />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
