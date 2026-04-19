import { useEffect } from "react";
import { Outlet, useNavigate } from "@remix-run/react";
import { isAuthenticated } from "~/utils/auth";

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirige al login si no está autenticado
    if (!isAuthenticated()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Renderiza las sub-rutas (admin.$id, etc)
  return <Outlet />;
}