import { useState } from "react";

interface PQRSD {
  id: number;
  content: string;
  channel: string;
  classification?: string;
  confidence?: number;
  status: string;
  created_at: string;
  from?: string;
  subject?: string;
}

interface ChannelViewProps {
  pqrs: PQRSD[];
  onViewDetail?: (id: number) => void;
}

export default function ChannelView({ pqrs, onViewDetail }: ChannelViewProps) {
  const [activeChannel, setActiveChannel] = useState<"all" | "email" | "chat" | "web">("all");

  // Agrupar por canal
  const filtered = activeChannel === "all" 
    ? pqrs 
    : pqrs.filter(p => p.channel === activeChannel);

  // Separar por canal
  const emailPqrs = pqrs.filter(p => p.channel === "email");
  const chatPqrs = pqrs.filter(p => p.channel === "chat");
  const webPqrs = pqrs.filter(p => p.channel === "web");

  const channels = [
    { id: "all", label: "Todas", count: pqrs.length, tag: "TODAS" },
    { id: "email", label: "Correo", count: emailPqrs.length, tag: "CORREO" },
    { id: "chat", label: "Chat", count: chatPqrs.length, tag: "CHAT" },
    { id: "web", label: "Web", count: webPqrs.length, tag: "WEB" },
  ];

  const renderEmailStyle = (pqr: PQRSD) => (
    <div 
      key={pqr.id}
      className="border border-gray-300 rounded-lg p-4 mb-4 bg-white hover:bg-gray-50 transition cursor-pointer"
      onClick={() => onViewDetail?.(pqr.id)}
    >
      {/* Email Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">
            {pqr.from || "Anónimo"}
          </p>
          <p className="text-sm text-gray-500">{pqr.created_at}</p>
        </div>
        <div className="text-right">
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
            pqr.status === "pending" ? "bg-yellow-100 text-yellow-800" :
            pqr.status === "analyzed" ? "bg-blue-100 text-blue-800" :
            pqr.status === "assigned" ? "bg-purple-100 text-purple-800" :
            "bg-green-100 text-green-800"
          }`}>
            {pqr.status}
          </span>
        </div>
      </div>

      {/* Subject line - Gmail style */}
      <p className="font-semibold text-gray-900 mb-2">
        {pqr.subject || "Sin asunto"}
      </p>

      {/* Preview of content */}
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
        {pqr.content}
      </p>

      {/* AI Classification */}
      {pqr.classification && (
        <div className="bg-blue-50 p-2 rounded text-xs mb-3">
          <p className="text-blue-900">
            <strong>IA:</strong> {pqr.classification}
            {pqr.confidence && ` (${Math.round(pqr.confidence * 100)}%)`}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 text-xs">
        <button className="text-blue-600 hover:underline">Responder</button>
        <button className="text-gray-500 hover:underline">Archivar</button>
      </div>
    </div>
  );

  const renderChatStyle = (pqr: PQRSD) => (
    <div 
      key={pqr.id}
      className="flex flex-col mb-3"
      onClick={() => onViewDetail?.(pqr.id)}
    >
      {/* Message bubble - left side (incoming) */}
      <div className="flex gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
          C
        </div>
        <div className="flex-1 max-w-xs">
          <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none break-words">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {pqr.from || "Ciudadano"}
            </p>
            <p className="text-gray-900">{pqr.content}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(pqr.created_at).toLocaleTimeString('es-CO')}
          </p>
        </div>
      </div>

      {/* IA Response bubble - right side */}
      {pqr.classification && (
        <div className="flex justify-end gap-2 mb-2">
          <div className="flex-1 max-w-xs">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-lg rounded-br-none">
              <p className="text-sm">
                <strong>Clasificación:</strong> {pqr.classification}
              </p>
              {pqr.confidence && (
                <p className="text-xs text-blue-100 mt-1">
                  Confianza: {Math.round(pqr.confidence * 100)}%
                </p>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
            IA
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex justify-end mb-3">
        <span className={`text-xs px-2 py-1 rounded-full ${
          pqr.status === "pending" ? "bg-yellow-100 text-yellow-800" :
          pqr.status === "analyzed" ? "bg-blue-100 text-blue-800" :
          pqr.status === "assigned" ? "bg-purple-100 text-purple-800" :
          "bg-green-100 text-green-800"
        }`}>
          {pqr.status}
        </span>
      </div>
    </div>
  );

  const renderWebStyle = (pqr: PQRSD) => (
    <div 
      key={pqr.id}
      className="border border-gray-200 rounded-lg p-4 mb-4 bg-white hover:shadow-md transition cursor-pointer"
      onClick={() => onViewDetail?.(pqr.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-gray-900">Solicitud #{pqr.id}</p>
          <p className="text-xs text-gray-500">
            {new Date(pqr.created_at).toLocaleDateString('es-CO')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          pqr.status === "pending" ? "bg-yellow-100 text-yellow-800" :
          pqr.status === "analyzed" ? "bg-blue-100 text-blue-800" :
          pqr.status === "assigned" ? "bg-purple-100 text-purple-800" :
          "bg-green-100 text-green-800"
        }`}>
          {pqr.status}
        </span>
      </div>

      <p className="text-gray-700 mb-3 line-clamp-3">{pqr.content}</p>

      {pqr.classification && (
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-gray-600">
            <strong>Tipo:</strong> {pqr.classification}
          </span>
          {pqr.confidence && (
            <span className="text-gray-500 text-xs">
              Confianza: {Math.round(pqr.confidence * 100)}%
            </span>
          )}
        </div>
      )}

      <button className="text-blue-600 text-sm hover:underline">
        Ver detalles →
      </button>
    </div>
  );

  return (
    <div className="w-full">
      {/* Channel Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannel(ch.id as any)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition font-medium ${
              activeChannel === ch.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="mr-2 inline-flex rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{ch.tag}</span>
            {ch.label}
            <span className="ml-2 text-xs bg-opacity-20 bg-gray-900 px-2 py-0.5 rounded-full">
              {ch.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No hay solicitudes en este canal
          </p>
        </div>
      ) : (
        <div>
          {activeChannel === "email" && (
            <div className="space-y-2">
              {filtered.map(renderEmailStyle)}
            </div>
          )}

          {activeChannel === "chat" && (
            <div className="bg-gray-50 rounded-lg p-4 max-w-2xl mx-auto">
              {filtered.map(renderChatStyle)}
            </div>
          )}

          {activeChannel === "web" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(renderWebStyle)}
            </div>
          )}

          {activeChannel === "all" && (
            <div className="space-y-8">
              {emailPqrs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Correo ({emailPqrs.length})
                  </h3>
                  <div className="space-y-2">
                    {emailPqrs.slice(0, 3).map(renderEmailStyle)}
                  </div>
                  {emailPqrs.length > 3 && (
                    <p className="text-center text-gray-500 text-sm mt-2">
                      +{emailPqrs.length - 3} más
                    </p>
                  )}
                </div>
              )}

              {chatPqrs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Chat ({chatPqrs.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {chatPqrs.slice(0, 2).map(renderChatStyle)}
                  </div>
                  {chatPqrs.length > 2 && (
                    <p className="text-center text-gray-500 text-sm mt-2">
                      +{chatPqrs.length - 2} más
                    </p>
                  )}
                </div>
              )}

              {webPqrs.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    Web ({webPqrs.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {webPqrs.slice(0, 2).map(renderWebStyle)}
                  </div>
                  {webPqrs.length > 2 && (
                    <p className="text-center text-gray-500 text-sm mt-2">
                      +{webPqrs.length - 2} más
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
