import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import ClientOnly from "./client-only";
import { ArrowRightIcon } from "./icons";

export default function Navbar() {
  return (
    <ClientOnly>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur-sm"
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img
              src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/uploads/2022/07/logo_mobile_header.png"
              alt="Logo Alcaldia de Medellin"
              className="h-10 w-auto rounded-md bg-slate-100 p-1"
            />
            <span className="text-lg font-black tracking-tight text-cyan-700 sm:text-xl">PQRSD Hub</span>
          </Link>

          {/* Centro: enlaces de navegación */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/#que-es" className="text-slate-600 hover:text-cyan-700 transition">
              ¿Qué es PQRS?
            </a>
            <a href="/#entidades" className="text-slate-600 hover:text-cyan-700 transition">
              Entidades
            </a>
            <a href="/#servicios" className="text-slate-600 hover:text-cyan-700 transition">
              Servicios
            </a>
          </div>

          {/* Derecha: botón de acción */}
          <Link
            to="/user"
            className="flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 active:scale-95"
          >
            Radicar PQRS
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>
    </ClientOnly>
  );
}