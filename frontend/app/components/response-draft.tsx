import { useEffect, useState } from "react";
import { API_BASE_URL } from "~/config";
import { getHeaders } from "~/utils/auth";

interface ResponseDraftProps {
  pqrId: number;
  onStatusUpdated?: (status: string) => void;
  pqrContext?: {
    content?: string;
    classification?: string;
    summary?: string;
    channel?: string;
  };
}

const buildPreResponse = (context?: ResponseDraftProps['pqrContext']) => {
  const classification = context?.classification && context.classification !== 'Sin clasificar'
    ? context.classification
    : 'el area competente';
  const summaryPart = context?.summary ? `Resumen del caso: ${context.summary}. ` : '';

  return [
    'Cordial saludo,',
    '',
    'Hemos recibido su solicitud y le informamos que ya se encuentra en proceso de gestion administrativa.',
    `${summaryPart}De manera preliminar, el caso fue orientado hacia ${classification}.`,
    'Nuestro equipo revisara la informacion aportada y, de ser necesario, solicitara datos adicionales para continuar el tramite.',
    'Agradecemos conservar este radicado para el seguimiento de su caso.',
    '',
    'Atentamente,',
    'Equipo de atencion ciudadana'
  ].join('\n');
};

export default function ResponseDraft({ pqrId, onStatusUpdated, pqrContext }: ResponseDraftProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
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

  const generateInstitutionalDraft = async () => {
    setGenerating(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/responses/${pqrId}/generate`, {
        method: 'POST',
        headers: getHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'No se pudo generar la prerespuesta');
      }

      setText(data.response?.response_text || data.generated || '');
      setMessage('Prerespuesta IA generada y guardada como borrador.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo generar la prerespuesta');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Pre-respuesta</h3>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">Puedes redactar manualmente o generar una base automatica.</p>
        <button
          type="button"
          onClick={() => setText(buildPreResponse(pqrContext))}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          Generar prerespuesta
        </button>
        <button
          type="button"
          onClick={generateInstitutionalDraft}
          disabled={generating}
          className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
        >
          {generating ? 'Generando IA...' : 'Generar IA institucional'}
        </button>
      </div>
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
