import { Link } from "@remix-run/react";
import { motion } from "framer-motion";
import ClientOnly from "./client-only";

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
          <Link to="/" className="flex items-center gap-3">
            <img
              src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/uploads/2022/07/logo_mobile_header.png"
              alt="Logo Alcaldia"
              className="h-10 w-auto rounded-md bg-slate-100 p-1"
            />
            <span className="text-lg font-black tracking-tight text-cyan-700 sm:text-xl">PQRSD Hub</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/user"
              className="rounded-xl border border-cyan-300 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-50 sm:px-4"
            >
                Enviar PQRSD
            </Link>
            <Link
              to="/admin"
              className="rounded-xl border border-amber-300 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-50 sm:px-4"
            >
                Panel Admin
            </Link>
          </div>
        </div>
      </motion.nav>
    </ClientOnly>
  );
}