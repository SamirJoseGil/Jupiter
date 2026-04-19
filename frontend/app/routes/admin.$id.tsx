import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import AdminLayout from "~/components/admin-layout";
import DetailView from "~/components/detail-view";
import Toast from "~/components/toast-notification";
import { isAuthenticated, getHeaders } from "~/utils/auth";
import { API_BASE_URL } from "~/config";

interface PQRSD {
  id: number;
  content: string;
  channel: string;
  classification?: string;
  confidence?: number;
  summary?: string;
  topics?: string[];
  multi_dependency?: boolean;
  status: string;
  created_at: string;
  assigned_department?: string;
  assigned_to_user_id?: number;
  updated_at: string;
}

export default function AdminDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pqr, setPqr] = useState<PQRSD | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const fetchPqr = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/pqrs/${id}`, {
          headers: getHeaders()
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/admin/login');
            return;
          }
          throw new Error('Solicitud no encontrada');
        }

        const data = await response.json();
        if (data && typeof data === 'object') {
          setPqr(data.pqr || data);
          setError(null);
        } else {
          throw new Error('Datos inválidos');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar";
        setError(message);
        setToast({ message, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPqr();
  }, [id, navigate]);

  const handleAnalyze = async () => {
    if (!pqr) return;
    setAnalyzing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze/${pqr.id}`, {
        method: "POST",
        headers: getHeaders()
      });

      if (!response.ok) throw new Error("Error al analizar");

      const updatedData = await response.json();
      setPqr(updatedData.pqr || updatedData);
      setToast({ message: "Análisis completado exitosamente", type: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setToast({ message, type: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (pqr) {
      setPqr({ ...pqr, status: newStatus });
    }
  };

  const handleCloseToast = () => {
    setToast(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando solicitud...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !pqr) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-red-600 font-medium text-lg mb-4">⚠️ {error || "Solicitud no encontrada"}</p>
            <button
              onClick={() => navigate('/admin')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Volver al Panel
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Header with navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4 flex items-center gap-1"
          >
            ← Volver al Panel
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Solicitud #{pqr.id}
              </h1>
              <p className="text-gray-600 mt-1">
                Creada: {new Date(pqr.created_at).toLocaleDateString("es-CO", { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Analyze Banner */}
        {pqr.status === "pending" && !pqr.classification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <p className="text-blue-900 font-medium">
                  Esta solicitud aún no ha sido analizada. Usa IA para clasificarla automáticamente.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition font-medium whitespace-nowrap"
              >
                {analyzing ? "Analizando..." : "Analizar IA"}
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2">
            <DetailView pqr={pqr} onStatusUpdate={handleStatusUpdate} />
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{
              borderLeftColor: {
                pending: "#fbbf24",
                analyzed: "#60a5fa",
                assigned: "#818cf8",
                resolved: "#34d399",
              }[pqr.status] || "#d1d5db"
            }}>
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">ESTADO</h3>
              <div className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                   style={{
                     backgroundColor: {
                       pending: "#fef3c7",
                       analyzed: "#dbeafe",
                       assigned: "#c7d2fe",
                       resolved: "#d1fae5",
                     }[pqr.status] || "#f3f4f6",
                     color: {
                       pending: "#92400e",
                       analyzed: "#1e40af",
                       assigned: "#3730a3",
                       resolved: "#065f46",
                     }[pqr.status] || "#111827",
                   }}>
                {pqr.status === "pending" && "📋 Pendiente"}
                {pqr.status === "analyzed" && "✓ Analizada"}
                {pqr.status === "assigned" && "👤 Asignada"}
                {pqr.status === "resolved" && "✓ Resuelta"}
              </div>
            </div>

            {/* Classification Card */}
            {pqr.classification && (
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">CLASIFICACIÓN</h3>
                <p className="text-gray-700 font-medium">{pqr.classification}</p>
                {pqr.confidence !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-gray-600">Confianza</p>
                      <span className="text-xs font-semibold text-gray-700">{pqr.confidence}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pqr.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Channel Card */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">CANAL</h3>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                {pqr.channel === "web" && "📱 Formulario Web"}
                {pqr.channel === "email" && "📧 Correo"}
                {pqr.channel === "chat" && "💬 Chat"}
                {pqr.channel === "phone" && "☎️ Teléfono"}
                {pqr.channel === "social" && "👍 Redes Sociales"}
              </span>
            </div>

            {/* Topics Card */}
            {pqr.topics && pqr.topics.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">TEMAS</h3>
                <div className="flex flex-wrap gap-2">
                  {pqr.topics.map((topic, idx) => (
                    <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-dependency Alert */}
            {pqr.multi_dependency && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>Múltiples dependencias</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={handleCloseToast}
        />
      )}
    </AdminLayout>
  );
}