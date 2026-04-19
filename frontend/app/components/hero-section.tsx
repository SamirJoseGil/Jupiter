// app/components/hero-section.tsx
import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import ClientOnly from "./client-only";
import { ArrowRightIcon } from "./icons";

export default function HeroSection() {
  return (
    <ClientOnly>
      <section className="relative flex min-h-screen overflow-hidden bg-slate-50 px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-px bg-slate-200" />
          <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-slate-200/50 blur-3xl" />
          <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-cyan-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 items-center">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
            {/* Contenido izquierdo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-5 sm:space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 w-fit rounded-full border border-slate-200 bg-white px-4 py-1">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs font-semibold text-slate-700 sm:text-sm">Canal oficial de atención ciudadana</span>
                </div>
                <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-6xl lg:text-7xl">
                  Atención institucional
                  <br />
                  <span className="text-slate-700">para tus PQRSDf</span>
                </h1>
              </div>

              <p className="max-w-md text-base leading-relaxed text-slate-600 sm:text-xl">
                Somos una dependencia de la Alcaldía de Medellín para recibir, clasificar y responder peticiones, quejas, reclamos, sugerencias y denuncias con trazabilidad y trato institucional.
              </p>

              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:gap-4 sm:pt-4">
                <Link
                  to="/user"
                  className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95 sm:w-auto sm:px-8 sm:py-4"
                >
                  Radicar PQRSDf Ahora
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
                <Link
                  to="/consultar-radicado"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-6 py-3 font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 sm:w-auto sm:px-8 sm:py-4"
                >
                  Consultar Radicado
                </Link>
                <a
                  href="#que-es"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 font-semibold text-slate-800 transition hover:bg-white sm:w-auto sm:px-8 sm:py-4"
                >
                  Conocer más
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-6 sm:gap-4 sm:pt-8">
                <div>
                  <p className="text-2xl font-black text-slate-900 sm:text-3xl">24/7</p>
                  <p className="text-sm text-slate-600">Disponible siempre</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 sm:text-3xl">100%</p>
                  <p className="text-sm text-slate-600">Oficial</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 sm:text-3xl">Seguimiento</p>
                  <p className="text-sm text-slate-600">Real</p>
                </div>
              </div>
            </motion.div>

            {/* Contenido derecho - Ilustración */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent" />

                <div className="relative space-y-6">
                  {/* Icono grande */}
                  <div className="flex justify-center">
                      <div className="flex h-80 w-80 items-center justify-center rounded-full bg-white p-5 shadow-sm sm:h-60 sm:w-60 lg:h-64 lg:w-64">
                        <img src="/img/Logo.png" alt="Jupiter" className="h-full w-full object-contain" />
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="space-y-4 text-center">
                    <h3 className="text-2xl font-bold text-slate-900">
                      Atención y respuesta institucional
                    </h3>
                    <p className="text-slate-600">
                      Clasificación asistida, trazabilidad y asignación interna para que cada solicitud llegue al área responsable de la Alcaldía.
                    </p>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Radicación por canales oficiales</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Asignación interna por dependencia</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">Respuesta institucional con trazabilidad</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </ClientOnly>
  );
}
