import { useState, useEffect } from "react";
import { useNavigate } from "@remix-run/react";
import AdminLayout from "~/components/admin-layout";
import Inbox from "~/components/inbox";
import EmailImporter from "~/components/email-importer";
import ChannelView from "~/components/channel-view";
import AdminResponseTemplate from "~/components/admin-response-template";
import AdminFaqManager from "~/components/admin-faq-manager";
import AdminUserManager from "~/components/admin-user-manager";
import { isAuthenticated, getHeaders, getStoredUser } from "~/utils/auth";
import { API_BASE_URL } from "~/config";

interface PQRSDfDf {
  id: number;
  content: string;
  channel: string;
  classification?: string;
  confidence?: number;
  status: string;
  created_at: string;
}

interface DashboardStats {
  total_PQRSDf?: number;
  pending?: number;
  analyzed?: number;
  assigned?: number;
  resolved?: number;
  response_metrics?: {
    total_responses: number;
    total_drafts: number;
    total_sent: number;
    draft_to_sent_ratio: number;
    avg_response_hours: number;
    pending_without_response: number;
  };
}

interface SurveyData {
  sample_size: number;
  questions: Array<{ id: number; question: string }>;
  ai_probe: {
    classification: string;
    confidence: number;
    summary: string;
    topics: string[];
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [PQRSDf, setPQRSDf] = useState<PQRSDfDf[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSection, setAdminSection] = useState<"dashboard" | "metrics">("dashboard");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [viewMode, setViewMode] = useState<"inbox" | "email">("inbox");
  const [useMultiChannelView, setUseMultiChannelView] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"template" | "faq" | "users">("template");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    setIsSuperadmin(user?.role === 'superadmin');

    try {
      const stored = window.localStorage.getItem("admin.sidebar.pinned");
      if (stored === "true") {
        setSidebarPinned(true);
        setSidebarOpen(true);
      }
    } catch {
      // Ignore storage errors.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("admin.sidebar.pinned", sidebarPinned ? "true" : "false");
    } catch {
      // Ignore storage errors.
    }
  }, [sidebarPinned]);

  useEffect(() => {
    if (!isSuperadmin && sidebarTab === 'users') {
      setSidebarTab('template');
    }
  }, [isSuperadmin, sidebarTab]);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    const fetchPQRSDf = async () => {
      try {
        const statusFilter = filter === 'all' ? '' : `&status=${filter}`;
        const response = await fetch(
          `${API_BASE_URL}/api/PQRSDf?page=${page}&limit=${limit}&paginate=true${statusFilter}`,
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
          setPQRSDf(data.data);
          setTotalPages(data.pagination.pages);
        } else {
          setPQRSDf(Array.isArray(data.PQRSDf) ? data.PQRSDf : []);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching PQRSDfs:", error);
        setPQRSDf([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/stats`, {
          headers: getHeaders()
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchPQRSDf();
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchPQRSDf, refreshInterval * 1000);
      return () => clearInterval(interval);
    }

    return undefined;
  }, [filter, page, limit, refreshInterval, navigate]);

  const displayedRequests = filter === 'all'
    ? PQRSDf
    : PQRSDf.filter((item) => item.status === filter);

  const generateSurvey = async () => {
    try {
      setSurveyLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/stats/survey-random?size=5`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error('No se pudo generar el sondeo');
      }

      const data = await response.json();
      setSurvey(data);
    } catch (error) {
      console.error('Survey error:', error);
      setSurvey(null);
    } finally {
      setSurveyLoading(false);
    }
  };

  const openToolsSidebar = (tab: "template" | "faq" | "users") => {
    setSidebarTab(tab);
    setSidebarOpen(true);
  };

  const renderMetricsSection = () => (
    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Metricas del Dashboard</h2>
            <p className="text-sm text-slate-600">Indicadores de respuestas y productividad administrativa.</p>
          </div>
          <button
            onClick={generateSurvey}
            disabled={surveyLoading}
            className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:opacity-60"
          >
            {surveyLoading ? "Generando sondeo IA..." : "Sondeo IA con preguntas aleatorias"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Respuestas enviadas</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.response_metrics?.total_sent ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Borradores</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.response_metrics?.total_drafts ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tiempo promedio respuesta</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.response_metrics?.avg_response_hours ?? 0}h</p>
          </div>
        </div>

        {survey && (
          <div className="rounded-2xl border border-[#3366CC]/20 bg-[#3366CC]/5 p-4">
            <p className="text-sm font-semibold text-[#3366CC]">Sondeo IA ({survey.sample_size} preguntas)</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">{survey.ai_probe.summary}</p>
            {survey.ai_probe?.topics?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {survey.ai_probe.topics.map((topic) => (
                  <span key={topic} className="rounded bg-white px-2 py-1 text-xs text-slate-700">#{topic}</span>
                ))}
              </div>
            )}
            {survey.questions?.length > 0 && (
              <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-sm font-semibold text-slate-800">Ver preguntas usadas en el sondeo</summary>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {survey.questions.map((q) => (
                    <li key={q.id}>• {q.question}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Pendientes</p>
          <p className="text-2xl font-bold text-slate-900">
            {PQRSDf.filter((p) => p.status === "pending").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Analizadas</p>
          <p className="text-2xl font-bold text-slate-900">
            {PQRSDf.filter((p) => p.status === "analyzed").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Asignadas</p>
          <p className="text-2xl font-bold text-slate-900">
            {PQRSDf.filter((p) => p.status === "assigned").length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Resueltas</p>
          <p className="text-2xl font-bold text-slate-900">
            {PQRSDf.filter((p) => p.status === "resolved").length}
          </p>
        </div>
      </div>
    </div>
  );

  const renderSidebarTools = () => (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-lg">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-700">Herramientas Admin</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarPinned((prev) => !prev)}
              className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                sidebarPinned
                  ? "border-[#3366CC]/30 bg-[#3366CC]/10 text-[#3366CC]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {sidebarPinned ? "Desfijar" : "Fijar"}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSidebarTab("template")}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              sidebarTab === "template"
                ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Plantillas
          </button>
          <button
            onClick={() => setSidebarTab("faq")}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              sidebarTab === "faq"
                ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            FAQ
          </button>
          {isSuperadmin && (
            <button
              onClick={() => setSidebarTab("users")}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                sidebarTab === "users"
                  ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Usuarios
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {sidebarTab === "template" && <AdminResponseTemplate />}
        {sidebarTab === "faq" && <AdminFaqManager />}
        {sidebarTab === "users" && isSuperadmin && <AdminUserManager />}
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Panel de Administrador</h1>
            <p className="mt-1 text-slate-600">
              {adminSection === "metrics"
                ? "Indicadores y sondeos administrativos"
                : viewMode === "inbox" && PQRSDf.length > 0
                ? `Mostrando ${displayedRequests.length} solicitudes (de ${limit} por consulta) - Pagina ${page}/${totalPages}`
                : viewMode === "inbox"
                ? "Cargando..."
                : "Importar emails"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAdminSection("dashboard")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                adminSection === "dashboard"
                  ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setAdminSection("metrics")}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                adminSection === "metrics"
                  ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Metricas
            </button>
            <button
              onClick={() => openToolsSidebar("template")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Plantillas
            </button>
            <button
              onClick={() => openToolsSidebar("faq")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              FAQ
            </button>
            {isSuperadmin && (
              <button
                onClick={() => openToolsSidebar("users")}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Usuarios
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Inicio
            </button>
          </div>
        </div>

        <div className={`relative ${sidebarOpen && sidebarPinned ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6" : ""}`}>
          <div>
            {adminSection === "metrics" ? (
              renderMetricsSection()
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setViewMode("inbox")}
                    className={`rounded-xl border px-4 py-2 font-semibold transition ${
                      viewMode === "inbox"
                        ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
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

                {viewMode === "email" ? (
                  <EmailImporter />
                ) : (
                  <>
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                      {["all", "pending", "analyzed", "assigned", "resolved"].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setFilter(status);
                            setPage(1);
                          }}
                          className={`rounded-xl border px-4 py-2 font-medium transition ${
                            filter === status
                              ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                              : "border-slate-300 bg-white text-slate-700 hover:border-[#3366CC]/25"
                          }`}
                        >
                          {status === "all" && "Todas"}
                          {status === "pending" && "Pendientes"}
                          {status === "analyzed" && "Analizadas"}
                          {status === "assigned" && "Asignadas"}
                          {status === "resolved" && "Resueltas"}
                        </button>
                      ))}

                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        <label className="text-sm text-slate-600">Solicitudes por consulta:</label>
                        <select
                          value={limit}
                          onChange={(e) => {
                            setLimit(parseInt(e.target.value, 10));
                            setPage(1);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>

                        <button
                          onClick={() => setUseMultiChannelView(!useMultiChannelView)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                            useMultiChannelView
                              ? "border-[#3366CC]/25 bg-[#3366CC]/10 text-[#3366CC]"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          title="Cambiar vista de canales"
                        >
                          {useMultiChannelView ? "Vista por Canales" : "Vista Normal"}
                        </button>

                        <label className="text-sm text-slate-600">Actualizar cada:</label>
                        <select
                          value={refreshInterval}
                          onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
                        >
                          <option value={15}>15s</option>
                          <option value={30}>30s (predeterminado)</option>
                          <option value={60}>1 min</option>
                          <option value={0}>Manual</option>
                        </select>
                      </div>
                    </div>

                    {useMultiChannelView ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
                        <ChannelView
                          PQRSDf={displayedRequests}
                          onViewDetail={(id) => {
                            navigate(`/admin/${id}`);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-slate-200 bg-white shadow-lg">
                        {loading ? (
                          <div className="p-12 text-center">
                            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#3366CC]"></div>
                            <p className="text-slate-500">Cargando solicitudes...</p>
                          </div>
                        ) : displayedRequests.length > 0 ? (
                          <>
                            <Inbox PQRSDf={displayedRequests} />

                            {totalPages > 1 && (
                              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                                <div className="text-sm text-slate-600">
                                  Pagina <span className="font-semibold">{page}</span> de <span className="font-semibold">{totalPages}</span>
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
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {sidebarOpen && sidebarPinned && <aside className="hidden lg:block">{renderSidebarTools()}</aside>}
        </div>

        {sidebarOpen && !sidebarPinned && (
          <div className="fixed inset-0 z-40 bg-slate-900/20" onClick={() => setSidebarOpen(false)}>
            <div
              className="absolute right-0 top-24 h-[calc(100vh-6rem)] w-full max-w-3xl p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="h-full">{renderSidebarTools()}</div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
