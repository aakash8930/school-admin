import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/admissions', label: 'Admissions' },
  { to: '/students', label: 'Students' },
  { to: '/staff', label: 'Staff' },
  { to: '/classes', label: 'Classes' },
  { to: '/fees', label: 'Fees' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/daycare', label: 'Daycare' },
  { to: '/academic', label: 'Academic' },
  { to: '/communication', label: 'Communication' },
  { to: '/users', label: 'Users' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full bg-slate-50 text-slate-900">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="px-6 py-5 text-lg font-semibold tracking-tight">
          School <span className="text-indigo-600">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          v0.1.0
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="text-sm text-slate-500">
            Signed in as{' '}
            <span className="font-medium text-slate-800">{user?.email}</span>
            <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-500">
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Sign out
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
