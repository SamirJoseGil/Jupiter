import Navbar from "~/components/navbar";
import PQRSDForm from "~/components/pqrsd-form";
import { useState } from "react";

export default function UserPage() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Solicitud Enviada!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu PQRSD ha sido registrada en el sistema. 
              Será revisada por nuestro equipo dentro de 15 días hábiles.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Puedes enviar otra solicitud cuando lo necesites.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
            >
              Enviar Otra Solicitud
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <PQRSDForm onSuccess={() => setSubmitted(true)} />
      </div>
    </div>
  );
}