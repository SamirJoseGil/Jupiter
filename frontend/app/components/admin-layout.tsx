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
    <div className="min-h-screen bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-black text-slate-900">Jupiter</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.email}
              {user?.department && ` - ${user.department}`}
            </span>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main id="main-content" className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[30%] h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
