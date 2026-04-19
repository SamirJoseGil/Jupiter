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
        className="sticky top-0 z-50 border-b border-white/20 bg-[#3366CC]/95 text-slate-900 backdrop-blur-sm"
      >
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
            <img
              src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/uploads/2022/07/logo_mobile_header.png"
              alt="Logo Alcaldia de Medellin"
              className="h-12 w-auto rounded-md p-1 sm:h-16"
            />
            <span className="text-lg font-black tracking-tight text-white sm:text-2xl">Jupiter</span>
          </Link>

          {/* Centro: enlaces de navegación */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="/#que-es" className="text-white/90 hover:text-white transition">
              ¿Qué es PQRS?
            </a>
            <a href="/#entidades" className="text-white/90 hover:text-white transition">
              Entidades
            </a>
            <a href="/#servicios" className="text-white/90 hover:text-white transition">
              Servicios
            </a>
          </div>

          {/* Derecha: botón de acción */}
          <Link
            to="/user"
            className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-95"
          >
            Radicar PQRS
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </motion.nav>
    </ClientOnly>
  );
}