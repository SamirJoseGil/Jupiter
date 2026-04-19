import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL, FORM_CHANNELS, OFFICIAL_CHANNEL_CONFIG, type FormChannel } from "~/config";
import ClientOnly from "./client-only";

interface SuggestionPreview {
  classification: string;
  confidence: number;
  topics: string[];
}

interface PQRSDfDfFormProps {
  onSuccess?: (payload?: { id: number; status: string }) => void;
}

const MIN_CONTENT_LENGTH = 20;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx']);
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const getExtension = (fileName: string) => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

const resolveMimeType = (file: File) => {
  if (file.type) {
    return file.type;
  }
  return MIME_BY_EXTENSION[getExtension(file.name)] || 'application/octet-stream';
};

const CONTACT_INTENTS: Array<{ label: string; hint: string; channel: FormChannel }> = [
  { label: "Jupiter", hint: "Radicación y seguimiento institucional", channel: "official-web" },
  { label: "Chatear por WhatsApp", hint: "Respuesta rápida por mensajería", channel: "official-whatsapp" },
  { label: "Usar asistente IA", hint: "Orientación guiada automática", channel: "official-ai" },
  { label: "Enviar por correo", hint: "Ideal para adjuntos", channel: "official-email" },
  { label: "Llamar por teléfono", hint: "Atención directa", channel: "official-phone" },
];

export default function PQRSDfDfForm({ onSuccess }: PQRSDfDfFormProps) {
  const [content, setContent] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [channel, setChannel] = useState<FormChannel>("official-web");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [imageEvidence, setImageEvidence] = useState<File[]>([]);
  const [documentEvidence, setDocumentEvidence] = useState<File[]>([]);
  const [suggestion, setSuggestion] = useState<SuggestionPreview | null>(null);
  const [suggestingLoading, setSuggestingLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const isOfficialChannel = channel.startsWith("official-");
  const officialConfig = isOfficialChannel ? OFFICIAL_CHANNEL_CONFIG[channel as keyof typeof OFFICIAL_CHANNEL_CONFIG] : null;
  const shouldRedirectToExternal = isOfficialChannel && channel !== 'official-web';

  const contentLength = content.trim().length;
  const isValidContent = contentLength >= MIN_CONTENT_LENGTH && contentLength <= 2000;

  const handleImageSelection = (files: File[]) => {
    const valid = files.filter((file) => ALLOWED_IMAGE_TYPES.has(file.type));
    const invalid = files.length - valid.length;
    setImageEvidence(valid);

    if (invalid > 0) {
      setMessageType('error');
      setMessage(`Se omitieron ${invalid} imagen(es). Solo se permiten formatos JPG, PNG y WEBP.`);
    }
  };

  const handleDocumentSelection = (files: File[]) => {
    const valid = files.filter((file) => {
      const extension = getExtension(file.name);
      return ALLOWED_DOCUMENT_TYPES.has(file.type) || ALLOWED_DOCUMENT_EXTENSIONS.has(extension);
    });
    const invalid = files.length - valid.length;
    setDocumentEvidence(valid);

    if (invalid > 0) {
      setMessageType('error');
      setMessage(`Se omitieron ${invalid} documento(s). Formatos permitidos: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT y PPTX.`);
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
      reader.readAsDataURL(file);
    });

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

    if (shouldRedirectToExternal && officialConfig) {
      window.open(officialConfig.redirectUrl, "_blank", "noopener,noreferrer");
      setMessageType("info");
      setMessage(`Te redirigimos a ${officialConfig.label}. Si no se abrió automáticamente, usa el botón de acceso directo.`);
      setLoading(false);
      return;
    }

    try {
      // VALIDAR PRIMERO antes de enviar al servidor
      if (!isValidContent) {
        setMessageType("error");
        setMessage(`Tu solicitud debe tener entre ${MIN_CONTENT_LENGTH} y 2000 caracteres.`);
        setLoading(false);
        return;
      }

      const evidenceImagesPayload = await Promise.all(
        imageEvidence.map(async (file) => ({
          fileName: file.name,
          contentType: resolveMimeType(file),
          dataUrl: await fileToDataUrl(file),
        }))
      );

      const evidenceDocumentsPayload = await Promise.all(
        documentEvidence.map(async (file) => ({
          fileName: file.name,
          contentType: resolveMimeType(file),
          dataUrl: await fileToDataUrl(file),
        }))
      );

      const response = await fetch(`${API_BASE_URL}/api/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          channel: officialConfig?.ingestChannel || channel,
          citizenId: citizenId.trim() || undefined,
          neighborhood: neighborhood.trim() || undefined,
          evidenceImages: evidenceImagesPayload,
          evidenceDocuments: evidenceDocumentsPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || "No fue posible radicar tu solicitud.");
      }

      const data = await response.json();
      setMessageType("success");
      setMessage(`PQRSDF enviada exitosamente. Radicado #${data?.pqr?.id ?? 'N/D'}`);
      setContent("");
      setCitizenId("");
      setNeighborhood("");
      setImageEvidence([]);
      setDocumentEvidence([]);
      setChannel("official-web");

      if (onSuccess) {
        setTimeout(() => onSuccess({ id: data?.pqr?.id, status: data?.pqr?.status }), 1200);
      }
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Error al enviar. Intenta de nuevo.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientOnly>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg"
      >
        <h2 className="mb-2 text-3xl font-black text-slate-900">Envía tu solicitud</h2>
        <p className="mb-6 text-sm text-slate-600">Canal ciudadano para peticiones, quejas, reclamos y sugerencias.</p>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">¿Cómo deseas contactarnos?</p>
          <p className="mt-1 text-xs text-slate-600">Selecciona una opción y te llevamos al canal oficial adecuado.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {CONTACT_INTENTS.map((intent) => (
              <button
                key={intent.channel}
                type="button"
                onClick={() => setChannel(intent.channel)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  channel === intent.channel
                    ? "border-cyan-300 bg-cyan-50"
                    : "border-slate-300 bg-white hover:border-cyan-200 hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{intent.label}</p>
                <p className="text-xs text-slate-600">{intent.hint}</p>
              </button>
            ))}
          </div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Canal */}
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
            Canal oficial de atención
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as FormChannel)}
            className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
          >
            {FORM_CHANNELS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {shouldRedirectToExternal && officialConfig && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">{officialConfig.label}</p>
            <p className="mt-1 text-sm text-amber-800">{officialConfig.description}</p>
            <p className="mt-1 text-xs font-medium text-amber-700">Se abrirá en una nueva pestaña o app oficial.</p>
            <button
              type="button"
              onClick={() => window.open(officialConfig.redirectUrl, "_blank", "noopener,noreferrer")}
              className="mt-3 rounded-xl border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              {officialConfig.actionLabel}
            </button>
          </div>
        )}

        {/* Contenido */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              C.C (opcional)
            </label>
            <input
              value={citizenId}
              onChange={(e) => setCitizenId(e.target.value)}
              placeholder="Ej: 1234567890"
              maxLength={30}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barrio (opcional)
            </label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ej: Laureles"
              maxLength={120}
              className="w-full rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu solicitud, queja o reclamo
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={shouldRedirectToExternal ? "Describe brevemente para tener un borrador antes de ir al canal oficial..." : "Cuéntanos qué necesitas..."}
            rows={6}
            maxLength={2000}
            required
            className="w-full resize-none rounded-xl border border-slate-300 bg-white/90 px-4 py-3 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isValidContent ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold"}>
              Minimo {MIN_CONTENT_LENGTH} y maximo 2000 caracteres
            </span>
            <span className={isValidContent ? "text-slate-600" : "text-red-600"}>{contentLength}/2000</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="evidence-images" className="block text-sm font-medium text-gray-700 mb-2">
              Evidencias en imagen (opcional)
            </label>
            <label
              htmlFor="evidence-images"
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm transition hover:border-[#3366CC]/40 hover:bg-[#3366CC]/5"
            >
              <span className="font-medium text-slate-700 group-hover:text-[#3366CC]">Seleccionar imagenes</span>
              <span className="rounded-lg border border-[#3366CC]/25 bg-[#3366CC]/10 px-3 py-1 text-xs font-semibold text-[#3366CC]">
                Examinar
              </span>
            </label>
            <input
              id="evidence-images"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) => handleImageSelection(Array.from(event.target.files || []))}
              className="hidden"
            />
            {imageEvidence.length > 0 && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700">{imageEvidence.length} archivo(s) seleccionados</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {imageEvidence.slice(0, 3).map((file) => (
                    <span key={file.name} className="rounded bg-white px-2 py-1 text-xs text-slate-600">
                      {file.name}
                    </span>
                  ))}
                  {imageEvidence.length > 3 && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">+{imageEvidence.length - 3} mas</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="evidence-documents" className="block text-sm font-medium text-gray-700 mb-2">
              Documentos (opcional)
            </label>
            <label
              htmlFor="evidence-documents"
              className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm transition hover:border-[#3366CC]/40 hover:bg-[#3366CC]/5"
            >
              <span className="font-medium text-slate-700 group-hover:text-[#3366CC]">Seleccionar documentos</span>
              <span className="rounded-lg border border-[#3366CC]/25 bg-[#3366CC]/10 px-3 py-1 text-xs font-semibold text-[#3366CC]">
                Examinar
              </span>
            </label>
            <input
              id="evidence-documents"
              type="file"
              accept=".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx"
              multiple
              onChange={(event) => handleDocumentSelection(Array.from(event.target.files || []))}
              className="hidden"
            />
            {documentEvidence.length > 0 && (
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-xs font-semibold text-emerald-700">{documentEvidence.length} archivo(s) seleccionados</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {documentEvidence.slice(0, 3).map((file) => (
                    <span key={file.name} className="rounded bg-white px-2 py-1 text-xs text-slate-600">
                      {file.name}
                    </span>
                  ))}
                  {documentEvidence.length > 3 && (
                    <span className="rounded bg-white px-2 py-1 text-xs text-slate-600">+{documentEvidence.length - 3} mas</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real-time AI Suggestion */}
        <AnimatePresence>
          {suggestion && contentLength >= 50 && !message && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-amber-50 p-4"
            >
            <div className="flex items-start gap-3">
              <span className="text-sm font-semibold text-slate-700">IA</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Sugerencia IA en tiempo real</p>
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
          {loading ? "Procesando..." : shouldRedirectToExternal && officialConfig ? officialConfig.actionLabel : "Enviar PQRSDF"}
        </button>
      </form>

      {/* Mensaje de estado */}
      {message && (
        <div
          aria-live="polite"
          className={`mt-4 rounded-xl p-4 text-center text-sm font-medium ${
            messageType === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : messageType === "error"
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-slate-200 bg-slate-100 text-slate-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Disclaimer */}
      <p className="mt-4 text-center text-xs text-slate-500">
        Tu solicitud será revisada por nuestro equipo dentro de 15 días hábiles.
      </p>
      </motion.div>
    </ClientOnly>
  );
}