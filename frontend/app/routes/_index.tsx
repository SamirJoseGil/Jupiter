import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import Navbar from "~/components/navbar";

export const meta: MetaFunction = () => {
  return [
    { title: "PQRSD Hub - Gestión Inteligente de Solicitudes" },
    { name: "description", content: "Plataforma centralizada para gestión de PQRSDs con IA" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🏛️ PQRSD Hub
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Gestión inteligente de peticiones, quejas, reclamos y sugerencias con apoyo de IA
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">👤 Ciudadano</h2>
              <p className="text-gray-600 mb-4">
                Envía tu solicitud de forma rápida y sencilla
              </p>
              <Link
                to="/user"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                Enviar Solicitud
              </Link>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-purple-600 mb-2">🧑‍💼 Administrador</h2>
              <p className="text-gray-600 mb-4">
                Gestiona y analiza solicitudes con inteligencia artificial
              </p>
              <Link
                to="/admin"
                className="inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition font-medium"
              >
                Ir al Panel
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 text-left">
            <h3 className="font-bold text-gray-900 mb-3">✨ Características</h3>
            <ul className="space-y-2 text-gray-600">
              <li>✅ Clasificación automática con IA</li>
              <li>📊 Análisis estructurado de solicitudes</li>
              <li>🌐 Ingesta multicanal (web, email, chat, etc)</li>
              <li>🤖 Sugerencias inteligentes para el admin</li>
              <li>📈 Validación humana de todas las decisiones</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
