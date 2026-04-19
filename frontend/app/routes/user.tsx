import Navbar from "~/components/navbar";
import PQRSDfDfForm from "~/components/pqrsd-form";
import FaqAssistant from "~/components/faq-assistant";
import { PqrsStatusCheck } from "~/components/pqrs-status-check";
import { useState } from "react";
import { Link } from "@remix-run/react";
import { CheckIcon } from "~/components/icons";

export default function UserPage() {
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState<number | null>(null);

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-900">
        <Navbar />
        <main id="main-content" className="relative flex-1 overflow-hidden px-4 py-12 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative mx-auto flex w-full max-w-3xl items-center justify-center">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <CheckIcon className="mx-auto mb-4 h-16 w-16 text-slate-700" />
            <h1 className="mb-2 text-3xl font-black text-slate-900">
              ¡Solicitud Enviada!
            </h1>
            <p className="mb-6 text-slate-600">
              Tu PQRSDF ha sido registrada en el sistema. 
              Será revisada por nuestro equipo dentro de 15 días hábiles.
            </p>
            {trackingId && (
              <p className="mb-4 rounded-xl border border-[#3366CC]/20 bg-[#3366CC]/5 px-4 py-3 text-sm font-semibold text-[#3366CC]">
                Radicado generado: #{trackingId}
              </p>
            )}
            <p className="mb-6 text-sm text-slate-500">
              Puedes enviar otra solicitud cuando lo necesites.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="rounded-xl border border-cyan-300 bg-cyan-50 px-6 py-3 font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Enviar Otra Solicitud
            </button>
              <Link
                to="/"
                className="ml-3 inline-flex rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ir al Inicio
              </Link>
          </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />
      <main id="main-content" className="relative flex-1 overflow-hidden px-4 py-12 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[30%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-center">
          <div className="w-full">
            <div className="mb-4 flex justify-end">
              <Link
                to="/"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Volver al Inicio
              </Link>
            </div>
            <FaqAssistant />
            <PqrsStatusCheck />
            <PQRSDfDfForm
              onSuccess={(payload) => {
                if (payload?.id) {
                  setTrackingId(payload.id);
                }
                setSubmitted(true);
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}