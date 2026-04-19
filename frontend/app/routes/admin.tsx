import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
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

export default function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminIndex = location.pathname === "/admin";
  const [pqrs, setPqrs] = useState<PQRSD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshInterval, setRefreshInterval] = useState(30); // Changed from 10s to 30s
  const [viewMode, setViewMode] = useState<"inbox" | "email">("inbox"); // New: switch between views
  const [useMultiChannelView, setUseMultiChannelView] = useState(false); // New: toggle multi-channel view

  useEffect(() => {
    if (!isAdminIndex) {
      return;
    }

    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const fetchPqrs = async () => {
      try {
        // Use pagination: 25 items per page
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
        
        // Handle both paginated and legacy responses
        if (data.data !== undefined) {
          // Paginated response
          setPqrs(data.data);
          setTotalPages(data.pagination.pages);
        } else {
          // Legacy response
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
    
    // Auto-refresh every 30 seconds (reduced from 10 to improve performance)
    const interval = setInterval(fetchPqrs, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [filter, page, refreshInterval, navigate, isAdminIndex]);

  if (!isAdminIndex) {
    return <Outlet />;
  }

  return (
    <AdminLayout>
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administrador</h1>
            <p className="text-gray-600 mt-1">
              {viewMode === "inbox" && pqrs.length > 0 
                ? `Mostrando ${pqrs.length} solicitudes - Página ${page}/${totalPages}` 
                : viewMode === "inbox"
                ? "Cargando..."
                : "Importar emails"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode("inbox");
                window.location.reload();
              }}
              className={`px-4 py-2 rounded-md font-medium transition ${
                viewMode === "inbox"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📥 Inbox
            </button>
            <button
              onClick={() => setViewMode("email")}
              className={`px-4 py-2 rounded-md font-medium transition ${
                viewMode === "email"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              📧 Importar Email
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
                    setPage(1); // Reset to page 1 when changing filter
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
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
                  className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                    useMultiChannelView
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                  title="Cambiar vista de canales"
                >
                  {useMultiChannelView ? "👁️ Vista por Canales" : "📋 Vista Normal"}
                </button>

                <label className="text-sm text-gray-600">Actualizar cada:</label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <ChannelView 
                  pqrs={pqrs} 
                  onViewDetail={(id) => {
                    // TODO: Navigate to detail view
                    console.log("View detail:", id);
                  }}
                />
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow-md">
                  {loading ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-gray-500">Cargando solicitudes...</p>
                    </div>
                  ) : pqrs.length > 0 ? (
                    <>
                      <Inbox pqrs={pqrs} />
                      
                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                          <div className="text-sm text-gray-600">
                            Página <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPage(Math.max(1, page - 1))}
                              disabled={page === 1}
                              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              ← Anterior
                            </button>
                            <button
                              onClick={() => setPage(Math.min(totalPages, page + 1))}
                              disabled={page === totalPages}
                              className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              Siguiente →
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">No hay solicitudes</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {!loading && pqrs.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-yellow-500">
                      <p className="text-sm text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {pqrs.filter((p) => p.status === "pending").length}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-blue-500">
                      <p className="text-sm text-gray-600">Analizadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {pqrs.filter((p) => p.status === "analyzed").length}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-purple-500">
                      <p className="text-sm text-gray-600">Asignadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {pqrs.filter((p) => p.status === "assigned").length}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-green-500">
                      <p className="text-sm text-gray-600">Resueltas</p>
                      <p className="text-2xl font-bold text-gray-900">
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