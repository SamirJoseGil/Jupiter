import { Link } from '@remix-run/react';
import Navbar from '~/components/navbar';
import Footer from '~/components/footer';
import FaqSection from '~/components/faq-section';

export default function PreguntasFrecuentesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main id="main-content" className="px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
