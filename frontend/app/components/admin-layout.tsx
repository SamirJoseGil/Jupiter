import { useEffect, useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { isAuthenticated, getStoredUser, logout } from '~/utils/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const authenticated = isMounted ? isAuthenticated() : false;
  const user = isMounted ? getStoredUser() : null;

  useEffect(() => {
    if (isMounted && !authenticated) {
      navigate('/admin/login');
    }
  }, [isMounted, authenticated, navigate]);

  if (!isMounted || !authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Jupiter</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.email}
              {user?.department && ` - ${user.department}`}
            </span>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
