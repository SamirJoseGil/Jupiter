// app/components/footer.tsx
import { Link } from "@remix-run/react";
import { MailIcon, LocationIcon, PhoneIcon } from "./icons";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[#3366CC]/20 bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Grid principal */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          {/* Información de la entidad */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="https://cdnwordpresstest-f0ekdgevcngegudb.z01.azurefd.net/es/wp-content/uploads/2022/07/logo_mobile_header.png"
                alt="Logo Alcaldia de Medellin"
                className="h-16 w-auto rounded-md p-1 sm:h-20"
              />
            </div>
            <p className="text-sm text-slate-300">
              Dependencia de atención ciudadana de la Alcaldía de Medellín para la gestión de peticiones, quejas, reclamos, sugerencias y denuncias.
            </p>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Navegación</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/#que-es" className="text-slate-300 hover:text-[#7FA2E8] transition">
                  ¿Qué es una PQRSDf?
                </Link>
              </li>
              <li>
                <Link to="/#entidades" className="text-slate-300 hover:text-[#7FA2E8] transition">
                  Entidades
                </Link>
              </li>
              <li>
                <Link to="/#servicios" className="text-slate-300 hover:text-[#7FA2E8] transition">
                  Cómo funciona
                </Link>
              </li>
              <li>
                <Link to="/user" className="text-slate-300 hover:text-[#7FA2E8] transition">
                  Radicar ahora
                </Link>
              </li>
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <PhoneIcon className="w-5 h-5 text-[#7FA2E8] flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">+57 4 3888000</span>
              </li>
              <li className="flex items-start gap-2">
                <MailIcon className="w-5 h-5 text-[#7FA2E8] flex-shrink-0 mt-0.5" />
                <a href="mailto:info@medellin.gov.co" className="text-slate-300 hover:text-[#7FA2E8] transition">
                  info@medellin.gov.co
                </a>
              </li>
              <li className="flex items-start gap-2">
                <LocationIcon className="w-5 h-5 text-[#7FA2E8] flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Medellín, Colombia</span>
              </li>
            </ul>
          </div>

          {/* Canales oficiales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Canales Oficiales</h3>
            <div className="space-y-2">
              <a
                href="/user"
                className="block text-sm text-slate-300 hover:text-[#7FA2E8] transition"
              >
                Jupiter
              </a>
              <a
                href="https://www.medellin.gov.co/es/contactenos/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-slate-300 hover:text-[#7FA2E8] transition"
              >
                WhatsApp Oficial
              </a>
              <a
                href="https://www.medellin.gov.co/es/contactenos/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-slate-300 hover:text-[#7FA2E8] transition"
              >
                Asistente IA
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-slate-700" />

        {/* Footer inferior */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-400">
            © {currentYear} Alcaldía de Medellín. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="/" className="text-slate-400 hover:text-[#7FA2E8] transition">
              Términos y Condiciones
            </a>
            <a href="/" className="text-slate-400 hover:text-[#7FA2E8] transition">
              Política de Privacidad
            </a>
            <a href="/#main-content" className="text-slate-400 hover:text-[#7FA2E8] transition">
              Accesibilidad
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
