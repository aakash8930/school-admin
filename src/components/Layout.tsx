import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

// SaaS console nav: the web app is for the super admin only. Schools
// (their admin accounts) manage day-to-day data through the school app.
const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
        <path d="M3 3h6v6H3V3Zm8 0h6v4h-6V3ZM3 11h6v6H3v-6Zm8-2h6v8h-6V9Z" />
      </svg>
    ),
  },
  {
    to: '/schools',
    label: 'Schools',
    end: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
        <path d="M10 2 2 6v2h16V6l-8-4Zm-6 8v6H2v2h16v-2h-2v-6h-2v6h-3v-6H9v6H6v-6H4Z" />
      </svg>
    ),
  },
  {
    to: '/users',
    label: 'Users',
    end: false,
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
        <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1 16c0-2.8 2.7-5 6-5s6 2.2 6 5v1H1v-1Zm13.5-3.6c2 .4 3.5 1.9 3.5 3.6v1h-3v-1c0-1.3-.5-2.6-1.4-3.5l.9-.1Z" />
      </svg>
    ),
  },
];

const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: '/schools', title: 'Schools' },
  { prefix: '/users', title: 'Users' },
  { prefix: '/', title: 'Dashboard' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pageTitle =
    PAGE_TITLES.find((p) =>
      p.prefix === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(p.prefix),
    )?.title ?? '';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initial = (user?.email ?? 'S')[0].toUpperCase();

  return (
    <div className="flex h-full bg-slate-100 text-slate-900">
      <aside className="flex w-64 flex-col bg-slate-900">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-bold text-white shadow-lg shadow-indigo-900/40">
            A
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white">
              AVAASchool
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Super admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Platform
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Signed-in user */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-semibold text-indigo-300">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-200">
                {user?.email}
              </div>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M9 2h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9v-2h5V4H9V2Zm1 7V6l-6 4 6 4v-3h5V9h-5Z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
          <div className="text-sm font-semibold text-slate-800">
            {pageTitle}
          </div>
          <div className="text-xs text-slate-400">
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
