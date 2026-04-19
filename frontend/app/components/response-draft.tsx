import { useEffect, useState } from "react";
import { API_BASE_URL } from "~/config";
import { getHeaders } from "~/utils/auth";

interface ResponseDraftProps {
  pqrId: number;
  onStatusUpdated?: (status: string) => void;
}

export default function ResponseDraft({ pqrId, onStatusUpdated }: ResponseDraftProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/responses/${pqrId}`, {
          headers: getHeaders()
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data.response?.response_text) {
          setText(data.response.response_text);
        }
      } catch (error) {
        console.error("Error loading draft:", error);
      }
    };

    loadDraft();
  }, [pqrId]);

  const saveDraft = async (send = false) => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/responses/${pqrId}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          response_text: text,
          send
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Operation failed");
      }

      setMessage(send ? "Respuesta enviada y solicitud resuelta" : "Borrador guardado");
      if (send) {
        onStatusUpdated?.("resolved");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar borrador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Pre-respuesta</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        placeholder="Escribe una respuesta para el ciudadano..."
      />
      {message && <p className="text-sm text-gray-700">{message}</p>}
      <div className="flex gap-3">
        <button
          disabled={loading || text.trim().length < 10}
          onClick={() => saveDraft(false)}
          className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:bg-gray-400"
        >
          Guardar borrador
        </button>
        <button
          disabled={loading || text.trim().length < 10}
          onClick={() => saveDraft(true)}
          className="px-4 py-2 bg-green-700 text-white rounded-md disabled:bg-gray-400"
        >
          Enviar respuesta
        </button>
      </div>
    </div>
  );
}
