import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, CHANNELS } from "~/config";

type Channel = "web" | "email" | "chat" | "phone" | "social";

interface SuggestionPreview {
  classification: string;
  confidence: number;
  topics: string[];
}

interface PQRSDFormProps {
  onSuccess?: () => void;
}

export default function PQRSDForm({ onSuccess }: PQRSDFormProps) {
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<Channel>("web");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<SuggestionPreview | null>(null);
  const [suggestingLoading, setSuggestingLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const contentLength = content.trim().length;
  const isValidContent = contentLength >= 20 && contentLength <= 2000;

  // Real-time suggestions with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Only suggest if content is long enough
    if (contentLength < 50) {
      setSuggestion(null);
      return;
    }

    setSuggestingLoading(true);

    // Debounce: wait 800ms before calling API
    debounceTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/analyze-preview`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) throw new Error("Análisis falló");

        const data = await response.json();
        setSuggestion(data.preview);
      } catch (error) {
        console.error("Suggestion error:", error);
        setSuggestion(null);
      } finally {
        setSuggestingLoading(false);
      }
    }, 800);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // VALIDAR PRIMERO antes de enviar al servidor
      if (!isValidContent) {
        setMessage("La solicitud debe tener entre 20 y 2000 caracteres");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, channel }),
      });

      if (!response.ok) throw new Error("Error submitting PQRSD");

      await response.json();
      setMessage("PQRSD enviada exitosamente!");
      setContent("");
      setChannel("web");

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error) {
      setMessage("Error al enviar. Intenta de nuevo.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mx-auto max-w-3xl rounded-3xl border border-white/30 bg-white/70 p-8 shadow-2xl backdrop-blur-xl"
    >
      <h2 className="mb-2 text-3xl font-black text-slate-900">Envia tu Solicitud</h2>
      <p className="mb-6 text-sm text-slate-600">Canal ciudadano para peticiones, quejas, reclamos y sugerencias.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Canal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal de entrada
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as Channel)}
            className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
          >
            {CHANNELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu solicitud, queja o reclamo
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Cuéntanos qué necesitas..."
            rows={6}
            maxLength={2000}
            required
            className="w-full resize-none rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isValidContent ? "text-gray-500" : "text-red-600"}>
              Minimo 20 caracteres, maximo 2000
            </span>
            <span className="text-gray-500">{contentLength}/2000</span>
          </div>
        </div>

        {/* Real-time AI Suggestion */}
        <AnimatePresence>
          {suggestion && contentLength >= 50 && !message && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-50/80 to-amber-50/80 p-4"
            >
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤖</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Sugerencia IA en Tiempo Real</p>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">Departamento sugerido:</p>
                    <p className="text-lg font-bold text-blue-600">{suggestion.classification}</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-blue-700 font-medium">Confianza</p>
                      <span className="text-sm font-semibold text-blue-800">{suggestion.confidence}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all"
                        style={{ width: `${suggestion.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                  {suggestion.topics && suggestion.topics.length > 0 && (
                    <div>
                      <p className="text-xs text-blue-700 font-medium mb-1">Temas detectados:</p>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.topics.slice(0, 3).map((topic, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-200 text-blue-700 rounded text-xs">
                            #{topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {suggestingLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              )}
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading suggestion message */}
        {suggestingLoading && contentLength >= 50 && (
          <div className="text-xs text-blue-600 flex items-center gap-2">
            <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-600"></div>
            Analizando con IA...
          </div>
        )}

        {/* Botón */}
        <button
          type="submit"
          disabled={loading || !isValidContent}
          className="w-full rounded-xl bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </form>

      {/* Mensaje de estado */}
      {message && (
        <div className="mt-4 rounded-xl bg-slate-100 p-4 text-center text-sm font-medium text-slate-800">
          {message}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Tu solicitud será revisada por nuestro equipo dentro de 15 días hábiles.
      </p>
    </motion.div>
  );
}