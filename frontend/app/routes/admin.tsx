import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "@remix-run/react";
import { isAuthenticated } from "~/utils/auth";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    if (location.pathname === '/admin') {
      navigate('/admin-dashboard');
    }
  }, [navigate, location.pathname]);

  // Renderiza las sub-rutas (admin.$id, etc)
  return <Outlet />;
}