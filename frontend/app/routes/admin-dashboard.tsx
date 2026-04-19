import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import AdminLayout from "~/components/admin-layout";
import Inbox from "~/components/inbox";
import EmailImporter from "~/components/email-importer";
import ChannelView from "~/components/channel-view";
import { isAuthenticated, getHeaders } from "~/utils/auth";
import { API_BASE_URL } from "~/config";

interface PQRSD {
  id: number;
  content: string;
  channel: string;
  classification?: string;
  confidence?: number;
  status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [pqrs, setPqrs] = useState<PQRSD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [viewMode, setViewMode] = useState<"inbox" | "email">("inbox");
  const [useMultiChannelView, setUseMultiChannelView] = useState(false);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const fetchPqrs = async () => {
      try {
        const statusFilter = filter === 'all' ? '' : `&status=${filter}`;
        const response = await fetch(
          `${API_BASE_URL}/api/pqrs?page=${page}&limit=25&paginate=true${statusFilter}`,
          { headers: getHeaders() }
        );
        
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/admin/login');
            return;
          }
          throw new Error('Failed to fetch');
        }

        const data = await response.json();
        
        if (data.data !== undefined) {
          setPqrs(data.data);
          setTotalPages(data.pagination.pages);
        } else {
          setPqrs(Array.isArray(data.pqrs) ? data.pqrs : []);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching PQRSs:", error);
        setPqrs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPqrs();
    
    const interval = setInterval(fetchPqrs, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [filter, page, refreshInterval, navigate]);

  return (
    <AdminLayout>
      <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Panel de Administrador</h1>
            <p className="mt-1 text-slate-600">
              {viewMode === "inbox" && pqrs.length > 0 
                ? `Mostrando ${pqrs.length} solicitudes - Página ${page}/${totalPages}` 
                : viewMode === "inbox"
                ? "Cargando..."
                : "Importar emails"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                setViewMode("inbox");
                window.location.reload();
              }}
              className={`rounded-xl border px-4 py-2 font-semibold transition ${
                viewMode === "inbox"
                  ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Inbox
            </button>
            <button
              onClick={() => setViewMode("email")}
              className={`rounded-xl border px-4 py-2 font-semibold transition ${
                viewMode === "email"
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Importar Email
            </button>
          </div>
        </div>

        {/* Show EmailImporter or Inbox based on viewMode */}
        {viewMode === "email" ? (
          <EmailImporter />
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2 mb-6 flex-wrap items-center">
              {["all", "pending", "analyzed", "assigned", "resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPage(1);
                  }}
                  className={`rounded-xl border px-4 py-2 font-medium transition ${
                    filter === status
                      ? "border-cyan-300 bg-cyan-50 text-cyan-700"
                      : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300"
                  }`}
                >
                  {status === "all" && "Todas"}
                  {status === "pending" && "Pendientes"}
                  {status === "analyzed" && "Analizadas"}
                  {status === "assigned" && "Asignadas"}
                  {status === "resolved" && "Resueltas"}
                </button>
              ))}

              {/* View Mode Toggle */}
              <div className="ml-auto flex gap-2 items-center">
                <button
                  onClick={() => setUseMultiChannelView(!useMultiChannelView)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    useMultiChannelView
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  title="Cambiar vista de canales"
                >
                  {useMultiChannelView ? "Vista por Canales" : "Vista Normal"}
                </button>

                <label className="text-sm text-slate-600">Actualizar cada:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                >
                  <option value={15}>15s</option>
                  <option value={30}>30s (predeterminado)</option>
                  <option value={60}>1 min</option>
                  <option value={0}>Manual</option>
                </select>
              </div>
            </div>

            {/* Inbox */}
            {useMultiChannelView ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                <ChannelView 
                  pqrs={pqrs} 
                  onViewDetail={(id) => {
                    navigate(`/admin/${id}`);
                  }}
                />
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-slate-200 bg-white shadow-lg">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-cyan-600"></div>
                      <p className="text-slate-500">Cargando solicitudes...</p>
                    </div>
                  ) : pqrs.length > 0 ? (
                    <>
                      <Inbox pqrs={pqrs} />
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                          <div className="text-sm text-slate-600">
                            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPage(Math.max(1, page - 1))}
                              disabled={page === 1}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button
                              onClick={() => setPage(Math.min(totalPages, page + 1))}
                              disabled={page === totalPages}
                              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-slate-500">No hay solicitudes</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {!loading && pqrs.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-600">Pendientes</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {pqrs.filter((p) => p.status === "pending").length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-600">Analizadas</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {pqrs.filter((p) => p.status === "analyzed").length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-600">Asignadas</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {pqrs.filter((p) => p.status === "assigned").length}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-sm text-slate-600">Resueltas</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {pqrs.filter((p) => p.status === "resolved").length}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
