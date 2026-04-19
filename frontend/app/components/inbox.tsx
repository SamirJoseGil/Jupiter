import { Link } from "@remix-run/react";

interface PQRSD {
  id: number;
  content: string;
  channel: string;
  classification?: string;
  confidence?: number;
  status: string;
  created_at: string;
}

interface InboxProps {
  pqrs: PQRSD[];
}

const getChannelLabel = (channel: string) => {
  const labels: Record<string, string> = {
    web: "Web",
    email: "Correo",
    chat: "Chat",
    phone: "Telefono",
    social: "Social",
  };
  return labels[channel] || channel;
};

const getChannelIcon = (channel: string) => {
  const icons: Record<string, string> = {
    web: "🌐",
    email: "📧",
    chat: "💬",
    phone: "☎️",
    social: "📱",
  };
  return icons[channel] || "📄";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    analyzed: "bg-blue-100 text-blue-800",
    assigned: "bg-purple-100 text-purple-800",
    resolved: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("es-CO", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const truncateText = (text: string, length: number = 100) => {
  return text.length > length ? text.substring(0, length) + "..." : text;
};

export default function Inbox({ pqrs }: InboxProps) {
  // Ensure pqrs is an array
  const pqrsList = Array.isArray(pqrs) ? pqrs : [];
  
  if (pqrsList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay solicitudes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pqrsList.map((pqr) => (
        <Link
          key={pqr.id}
          to={`/admin/${pqr.id}`}
          className="block p-4 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {/* Canal Icon */}
            <div className="text-3xl flex-shrink-0">{getChannelIcon(pqr.channel)}</div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-gray-900 truncate">
                  {pqr.classification || "Sin clasificar"}
                </p>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${getStatusColor(pqr.status)}`}>
                  {pqr.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {truncateText(pqr.content, 80)}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {formatDate(pqr.created_at)}
                </span>
                {pqr.confidence && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    Confianza: {pqr.confidence}%
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <div className="text-gray-400 flex-shrink-0">→</div>
          </div>
        </Link>
      ))}
    </div>
  );
}