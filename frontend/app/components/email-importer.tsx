import { useState } from "react";
import Toast from "./toast-notification";
import { API_BASE_URL } from "../config";

export default function EmailImporter() {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);
  const [extractedData, setExtractedData] = useState<{
    from: string;
    subject: string;
    body: string;
  } | null>(null);

  const parseEmail = (text: string) => {
    // Simple email parser
    const fromMatch = text.match(/From:\s*(.+?)(?:\n|$)/i);
    const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);

    // Extract body (everything after headers)
    const headerEndIndex = text.indexOf("\n\n");
    const body =
      headerEndIndex !== -1 ? text.substring(headerEndIndex + 2).trim() : text;

    return {
      from: fromMatch ? fromMatch[1].trim() : "unknown@example.com",
      subject: subjectMatch ? subjectMatch[1].trim() : "Sin asunto",
      body: body,
    };
  };

  const handlePreview = () => {
    if (!emailText.trim()) {
      setToast({
        type: "warning",
        message: "Por favor pega el contenido del email",
      });
      return;
    }

    const parsed = parseEmail(emailText);
    setExtractedData(parsed);
    setToast({
      type: "info",
      message: "Email parseado correctamente",
    });
  };

  const handleImport = async () => {
    if (!extractedData) {
      setToast({
        type: "warning",
        message: "Primero debes hacer preview del email",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/import-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          from: extractedData.from,
          subject: extractedData.subject,
          content: extractedData.body,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al importar email");
      }

      const data = await response.json();
      setToast({
        type: "success",
        message: `Email importado (ID: ${data.id}, Clasificación: ${data.classification})`,
      });

      // Reset form
      setEmailText("");
      setExtractedData(null);

      // Refresh parent (caller should handle this)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setToast({
        type: "error",
        message: "Error al importar. Intenta de nuevo.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Importar desde Email
      </h2>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Instrucciones:</strong> Copia el contenido completo del
            email (incluyendo From:, Subject:, y el cuerpo) y pégalo abajo. El
            sistema extraerá automáticamente la información.
          </p>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email completo
          </label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            placeholder={`From: ciudadano@example.com
Subject: Problema con infraestructura

Estimados,

Tengo un problema grave con los huecos en la avenida principal...`}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo 20 caracteres en el cuerpo del email
          </p>
        </div>

        {/* Preview Section */}
        {extractedData && (
          <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Preview del email</h3>
            <div>
              <label className="text-xs font-medium text-gray-600">
                From:
              </label>
              <p className="text-sm text-gray-800">{extractedData.from}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Subject:
              </label>
              <p className="text-sm text-gray-800">{extractedData.subject}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">
                Body:
              </label>
              <p className="text-sm text-gray-800 line-clamp-3">
                {extractedData.body}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handlePreview}
            disabled={loading || !emailText.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
          >
            Vista previa
          </button>

          <button
            onClick={handleImport}
            disabled={loading || !extractedData}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">...</span> Importando...
              </>
            ) : (
              <>Importar como PQRSDf</>
            )}
          </button>

          <button
            onClick={() => {
              setEmailText("");
              setExtractedData(null);
            }}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
