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
  avg_classification_confidence?: number;
  total_corrected?: number;
  time_saved_minutes?: number;
  channel_distribution?: Array<{ channel: string; count: number }>;
  department_distribution?: Array<{ label: string; count: number }>;
  activity_last_7_days?: Array<{ label: string; count: number }>;
  evidence_rate?: number;
  evidence_total?: number;
  evidence_missing?: number;
  response_metrics?: {
    total_responses: number;
    total_drafts: number;
    total_sent: number;
    draft_to_sent_ratio: number;
    avg_response_hours: number;
    pending_without_response: number;
  };
  response_breakdown?: {
    activity_last_7_days?: Array<{ label: string; count: number }>;
    status_distribution?: Array<{ status: string; count: number }>;
  };
  faq_metrics?: {
    total_faqs: number;
    total_usage: number;
    avg_usage: number;
    top_faqs: Array<{ id: number; question: string; usage_count: number }>;
  };
  user_metrics?: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    superadmins: number;
    admins: number;
    role_distribution: Array<{ label: string; count: number }>;
    department_distribution: Array<{ label: string; count: number }>;
    recent_users: Array<{ id: number; email: string; role: string; department?: string; is_active: boolean }>;
  };
  template_metrics?: {
    total_templates: number;
    active_templates: number;
    inactive_templates: number;
    recent_templates: Array<{ id: number; name: string; is_active: boolean }>;
  };
}

const formatMetricLabel = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getMaxValue = (items: Array<{ count: number }>) => Math.max(...items.map((item) => item.count), 1);

const MetricRing = ({
  label,
  value,
  description,
  tone = '#3366CC',
}: {
  label: string;
  value: number;
  description: string;
  tone?: string;
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div
      className="mx-auto flex h-28 w-28 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${tone} ${Math.min(Math.max(value, 0), 100)}%, #e2e8f0 0)` }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center">
        <div>
          <p className="text-xl font-black text-slate-900">{Math.round(value)}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        </div>
      </div>
    </div>
    <p className="mt-3 text-center text-sm text-slate-600">{description}</p>
  </div>
);

const MetricBars = ({
  title,
  subtitle,
  items,
  accentClass = 'bg-[#3366CC]',
  valueFormatter = (count: number) => String(count),
}: {
  title: string;
  subtitle: string;
  items?: Array<{ label?: string; channel?: string; status?: string; count: number }>;
  accentClass?: string;
  valueFormatter?: (count: number) => string;
}) => {
  const normalized = (items || []).map((item) => ({
    label: item.label || item.channel || item.status || 'Otro',
    count: item.count,
  }));
  const maxValue = getMaxValue(normalized);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {normalized.length === 0 ? (
        <p className="text-sm text-slate-500">No hay datos para mostrar.</p>
      ) : (
        <div className="space-y-3">
          {normalized.map((item) => {
            const percentage = Math.max((item.count / maxValue) * 100, 6);

            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-700">{formatMetricLabel(item.label)}</span>
                  <span className="font-semibold text-slate-900">{valueFormatter(item.count)}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className={`h-3 rounded-full ${accentClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

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
            <p className="text-sm text-slate-600">Indicadores operativos y analiticos para administradores.</p>
          </div>
          <button
            onClick={generateSurvey}
            disabled={surveyLoading}
            className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15 disabled:opacity-60"
          >
            {surveyLoading ? "Generando sondeo IA..." : "Sondeo IA con preguntas aleatorias"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Solicitudes totales</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.total_PQRSDf ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Confianza promedio</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.avg_classification_confidence ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tiempo ahorrado</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.time_saved_minutes ?? 0}m</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Evidencias adjuntas</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{stats?.evidence_total ?? 0}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricRing
            label="Cobertura"
            value={stats?.response_metrics?.total_responses ? Math.min(((stats.response_metrics.total_sent / stats.response_metrics.total_responses) * 100), 100) : 0}
            description="Porcentaje de respuestas ya enviadas respecto al total de borradores y envíos."
            tone="#0f766e"
          />
          <MetricRing
            label="Resolución"
            value={stats?.total_PQRSDf ? Math.min(((stats.resolved || 0) / stats.total_PQRSDf) * 100, 100) : 0}
            description="Proporción de solicitudes resueltas dentro del total acumulado."
            tone="#3366CC"
          />
          <MetricRing
            label="Evidencias"
            value={stats?.evidence_rate ?? 0}
            description="Solicitudes que incluyen archivos de soporte válidos."
            tone="#b45309"
          />
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

      <div className="grid gap-4 xl:grid-cols-2">
        <MetricBars
          title="Solicitudes por canal"
          subtitle="Distribucion por canal de ingreso de las solicitudes."
          items={stats?.channel_distribution?.map((item) => ({ label: item.channel, count: item.count }))}
          accentClass="bg-[#3366CC]"
        />
        <MetricBars
          title="Solicitudes por dependencia"
          subtitle="Dependencias con mayor carga de solicitudes."
          items={stats?.department_distribution}
          accentClass="bg-amber-500"
        />
        <MetricBars
          title="Actividad de solicitudes (7 días)"
          subtitle="Volumen diario de solicitudes recientes."
          items={stats?.activity_last_7_days}
          accentClass="bg-emerald-500"
        />
        <MetricBars
          title="Actividad de respuestas (7 días)"
          subtitle="Respuestas redactadas o enviadas por día."
          items={stats?.response_breakdown?.activity_last_7_days}
          accentClass="bg-violet-500"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">FAQ mas consultadas</h3>
              <p className="text-sm text-slate-600">Preguntas frecuentes con mayor uso acumulado.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {stats?.faq_metrics?.total_faqs ?? 0} FAQ
            </div>
          </div>

          {stats?.faq_metrics?.top_faqs?.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Pregunta</th>
                    <th className="px-4 py-3">Usos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {stats.faq_metrics.top_faqs.map((faq) => (
                    <tr key={faq.id}>
                      <td className="px-4 py-3 text-slate-700">{faq.question}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{faq.usage_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aún no hay FAQ para mostrar.</p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Usuarios y plantillas</h3>
              <p className="text-sm text-slate-600">Resumen para control operativo y de permisos.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {stats?.user_metrics?.total_users ?? 0} usuarios
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Superadmins</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats?.user_metrics?.superadmins ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Plantillas activas</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{stats?.template_metrics?.active_templates ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <MetricBars
              title="Roles de usuario"
              subtitle="Distribucion por nivel de acceso."
              items={stats?.user_metrics?.role_distribution}
              accentClass="bg-slate-900"
            />
            <MetricBars
              title="Dependencias con usuarios"
              subtitle="Usuarios por dependencia registrada."
              items={stats?.user_metrics?.department_distribution}
              accentClass="bg-amber-500"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Usuario reciente</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {(stats?.user_metrics?.recent_users || []).map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatMetricLabel(user.role)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Pendientes</p>
          <p className="text-2xl font-bold text-slate-900">{PQRSDf.filter((p) => p.status === "pending").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Analizadas</p>
          <p className="text-2xl font-bold text-slate-900">{PQRSDf.filter((p) => p.status === "analyzed").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Asignadas</p>
          <p className="text-2xl font-bold text-slate-900">{PQRSDf.filter((p) => p.status === "assigned").length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Resueltas</p>
          <p className="text-2xl font-bold text-slate-900">{PQRSDf.filter((p) => p.status === "resolved").length}</p>
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
