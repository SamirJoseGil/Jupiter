import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import Navbar from "~/components/navbar";
import ClientOnly from "~/components/client-only";

export const meta: MetaFunction = () => {
  return [
    { title: "PQRSD Hub - Gestión Inteligente de Solicitudes" },
    { name: "description", content: "Plataforma centralizada para gestión de PQRSDs con IA" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <Navbar />
      <main className="relative flex-1 overflow-hidden px-4 py-12 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[30%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-12">
          <ClientOnly>
            <motion.section
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <img
                  src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/uploads/2022/07/logo_mobile_header.png"
                  alt="Logo Alcaldia de Medellin"
                  className="h-12 w-auto rounded-lg bg-white/80 p-1"
                />
                <img
                  src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/themes/theme_alcaldia/img/logo_2022.png"
                  alt="Alcaldia de Medellin"
                  className="h-12 w-auto rounded-lg bg-white/80 p-1"
                />
              </div>

              <h1 className="mb-4 text-4xl font-black leading-tight text-white sm:text-5xl">
                PQRSD Hub Inteligente
              </h1>
              <p className="mb-8 max-w-2xl text-lg text-slate-200">
                Plataforma de atencion ciudadana con analitica asistida por IA para priorizar, clasificar y resolver solicitudes con mayor velocidad.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/user"
                  className="rounded-2xl border border-cyan-300/40 bg-cyan-400/20 px-6 py-4 text-center font-semibold text-cyan-100 transition hover:bg-cyan-400/35"
                >
                  Radicar Solicitud
                </Link>
                <Link
                  to="/admin"
                  className="rounded-2xl border border-amber-300/40 bg-amber-400/20 px-6 py-4 text-center font-semibold text-amber-100 transition hover:bg-amber-400/35"
                >
                  Acceder Panel Admin
                </Link>
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="lg:col-span-5"
          >
            <div className="h-full rounded-3xl border border-white/20 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
              <h2 className="mb-5 text-2xl font-bold text-white">Capacidades Clave</h2>
              <ul className="space-y-4 text-slate-200">
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Clasificacion automatica con IA para direccionar casos.</li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Analisis multicanal: web, email y canales asistidos.</li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Panel operativo para seguimiento de estado y respuesta.</li>
                <li className="rounded-xl border border-white/10 bg-white/5 p-3">Trazabilidad completa para auditoria y calidad de servicio.</li>
              </ul>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
