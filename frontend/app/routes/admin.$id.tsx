import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@remix-run/react";
import AdminLayout from "~/components/admin-layout";
import DetailView from "~/components/detail-view";
import Toast from "~/components/toast-notification";
import { isAuthenticated, getHeaders } from "~/utils/auth";
import { API_BASE_URL } from "~/config";
import { InfoIcon } from "~/components/icons";

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
            <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-600"></div>
            <p className="text-slate-600">Cargando solicitud...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !pqr) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <p className="mb-4 text-lg font-medium text-red-600">Atención: {error || "Solicitud no encontrada"}</p>
            <button
              onClick={() => navigate('/admin')}
              className="rounded-xl border border-cyan-300 bg-cyan-50 px-6 py-2 font-semibold text-cyan-700 transition hover:bg-cyan-100"
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1 rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              ← Volver al Panel
            </button>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ir al Inicio
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">
                Solicitud #{pqr.id}
              </h1>
              <p className="mt-1 text-slate-600">
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
          <div className="mb-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <InfoIcon className="h-6 w-6 text-cyan-700" />
                <p className="font-medium text-cyan-900">
                  Esta solicitud aún no ha sido analizada. Usa IA para clasificarla automáticamente.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="whitespace-nowrap rounded-xl border border-cyan-300 bg-white px-6 py-2 font-semibold text-cyan-700 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" style={{
              borderLeftColor: {
                pending: "#fbbf24",
                analyzed: "#60a5fa",
                assigned: "#818cf8",
                resolved: "#34d399",
              }[pqr.status] || "#d1d5db"
            }}>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">ESTADO</h3>
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
                {pqr.status === "pending" && "Pendiente"}
                {pqr.status === "analyzed" && "Analizada"}
                {pqr.status === "assigned" && "Asignada"}
                {pqr.status === "resolved" && "Resuelta"}
              </div>
            </div>

            {/* Classification Card */}
            {pqr.classification && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">CLASIFICACIÓN</h3>
                <p className="font-medium text-slate-700">{pqr.classification}</p>
                {pqr.confidence !== undefined && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-slate-600">Confianza</p>
                      <span className="text-xs font-semibold text-slate-700">{pqr.confidence}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${pqr.confidence}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Channel Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">CANAL</h3>
              <span className="inline-block rounded-md bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {pqr.channel === "web" && "Formulario Web"}
                {pqr.channel === "email" && "Correo"}
                {pqr.channel === "chat" && "Chat"}
                {pqr.channel === "phone" && "Teléfono"}
                {pqr.channel === "social" && "Redes Sociales"}
              </span>
            </div>

            {/* Topics Card */}
            {pqr.topics && pqr.topics.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-sm font-semibold text-slate-900">TEMAS</h3>
                <div className="flex flex-wrap gap-2">
                  {pqr.topics.map((topic, idx) => (
                    <span key={idx} className="rounded text-xs font-medium bg-amber-100 px-2 py-1 text-amber-700">
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
                  <span>Atención</span>
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