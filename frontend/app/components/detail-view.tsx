import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { API_BASE_URL, DEPARTMENTS } from "~/config";
import { getHeaders } from "~/utils/auth";
import ResponseDraft from "~/components/response-draft";
import Toast from "~/components/toast-notification";
import { InfoIcon } from "~/components/icons";

interface DetailViewProps {
  pqr: {
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
  };
  onStatusUpdate?: (newStatus: string) => void;
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

export default function DetailView({ pqr, onStatusUpdate }: DetailViewProps) {
  const navigate = useNavigate();
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [classificationInput, setClassificationInput] = useState(pqr.classification || "");
  const [confidenceInput, setConfidenceInput] = useState<number>(pqr.confidence || 80);
  const [departmentInput, setDepartmentInput] = useState("");
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqr.id}/status`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        onStatusUpdate?.(newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAcceptClassification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqr.id}/accept`, {
        method: "POST",
        headers: getHeaders()
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "No se pudo aceptar");

      onStatusUpdate?.("assigned");
      setToast({ message: "✓ Clasificación aceptada", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al aceptar",
        type: "error"
      });
    }
  };

  const handleModifyClassification = async () => {
    try {
      if (!classificationInput) {
        setToast({ message: "Ingresa una clasificación", type: "error" });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqr.id}/classification`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          classification: classificationInput,
          confidence: Number(confidenceInput),
          adminNotes: "Actualización manual desde panel"
        })
      });

      if (!response.ok) throw new Error("No se pudo actualizar");

      setShowModifyModal(false);
      setToast({ message: "✓ Clasificación actualizada", type: "success" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al actualizar",
        type: "error"
      });
    }
  };

  const handleAssignDepartment = async () => {
    try {
      if (!departmentInput) {
        setToast({ message: "Selecciona una dependencia", type: "error" });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/PQRSDf/${pqr.id}/assign`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ department: departmentInput })
      });

      if (!response.ok) throw new Error("No se pudo asignar");

      setShowAssignModal(false);
      setDepartmentInput("");
      onStatusUpdate?.("assigned");
      setToast({ message: "✓ Solicitud asignada", type: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Error al asignar",
        type: "error"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contenido</h2>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {pqr.content}
          </p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {new Date(pqr.created_at).toLocaleDateString("es-CO", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}
        </p>
      </div>

      {/* AI Analysis Results */}
      {pqr.classification && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Classification */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-600 uppercase mb-2">Clasificación</p>
            <p className="text-lg font-bold text-blue-900">{pqr.classification}</p>
            {pqr.confidence && (
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-blue-700">Confianza</span>
                  <span className="text-sm font-semibold text-blue-900">{pqr.confidence}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${pqr.confidence}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {pqr.summary && (
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-green-600 uppercase mb-2">Resumen</p>
              <p className="text-sm text-green-900 line-clamp-3">{pqr.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Topics */}
      {pqr.topics && pqr.topics.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Temas Detectados</p>
          <div className="flex flex-wrap gap-2">
            {pqr.topics.map((topic, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
              >
                #{topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Multi-dependency Alert */}
      {pqr.multi_dependency && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <InfoIcon className="h-5 w-5 text-red-700 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Múltiples Dependencias</p>
            <p className="text-sm text-red-700 mt-1">Requiere coordinación inter-institucional</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
        <h3 className="font-semibold text-gray-900 mb-4">Acciones</h3>

        <button
          onClick={handleAcceptClassification}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
        >
          <span>Aceptar</span> Clasificación
        </button>

        <button
          onClick={() => setShowModifyModal(true)}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition font-medium flex items-center justify-center gap-2"
        >
          <span>Editar</span> Clasificación
        </button>

        <button
          onClick={() => setShowAssignModal(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
        >
          <span>Asignar</span> a Dependencia
        </button>
      </div>

      {/* Response Draft */}
      <ResponseDraft pqrId={pqr.id} onStatusUpdated={onStatusUpdate} />

      {/* Modify Classification Modal */}
      {showModifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Modificar Clasificación</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <select
                  value={classificationInput}
                  onChange={(e) => setClassificationInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Selecciona un departamento</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confianza: {confidenceInput}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={confidenceInput}
                  onChange={(e) => setConfidenceInput(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModifyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleModifyClassification}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition font-medium"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Department Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Asignar a Dependencia</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <select
                value={departmentInput}
                onChange={(e) => setDepartmentInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona un departamento</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignDepartment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium"
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}