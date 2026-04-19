import { Link, useNavigate } from '@remix-run/react';
import { useEffect, useMemo, useState } from 'react';
import { isAuthenticated, getStoredUser, getAvatarSrc, logout } from '~/utils/auth';
import { ArrowRightIcon } from './icons';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const authenticated = isMounted ? isAuthenticated() : false;
  const user = isMounted ? getStoredUser() : null;
  const avatarSrc = useMemo(() => getAvatarSrc(user), [user]);
  const userInitials = useMemo(() => {
    if (!user?.email) return 'A';
    return user.email.slice(0, 2).toUpperCase();
  }, [user]);

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
      <nav className="sticky top-0 z-50 border-b border-[#3366CC]/20 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Panel administrativo</p>
              <h1 className="text-2xl font-black text-slate-900">Jupiter</h1>
            </div>
            <div className="hidden h-10 w-px bg-slate-200 sm:block" />
            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#3366CC]/10 text-xs font-bold text-[#3366CC]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar de administrador" className="h-full w-full object-cover" />
                ) : (
                  userInitials
                )}
              </div>
              <div className="text-sm leading-tight">
                <p className="font-semibold text-slate-900">{user?.email}</p>
                <p className="text-slate-500">{user?.department || 'Administración'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin-dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15"
            >
              Panel
            </Link>
            <Link
              to="/admin/account"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Mi cuenta
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Inicio
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="rounded-xl border border-[#3366CC]/25 bg-[#3366CC]/10 px-4 py-2 text-sm font-semibold text-[#3366CC] transition hover:bg-[#3366CC]/15"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>
      <main id="main-content" className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-[-20%] h-96 w-96 rounded-full bg-[#3366CC]/10 blur-3xl" />
          <div className="absolute right-[-10%] top-[20%] h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute bottom-[-20%] left-[30%] h-96 w-96 rounded-full bg-slate-200/40 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
