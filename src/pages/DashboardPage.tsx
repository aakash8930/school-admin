import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../lib/api';
import type {
  PaginatedResult,
  School,
  SchoolStats,
  SchoolStatus,
  User,
} from '../lib/types';

// Status colors are reserved for state and always paired with a label.
const STATUS_META: Record<
  SchoolStatus,
  { label: string; bar: string; pill: string; dot: string }
> = {
  active: {
    label: 'Active',
    bar: 'bg-emerald-500',
    pill: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  trial: {
    label: 'Trial',
    bar: 'bg-sky-500',
    pill: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  suspended: {
    label: 'Suspended',
    bar: 'bg-amber-500',
    pill: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  inactive: {
    label: 'Inactive',
    bar: 'bg-slate-300',
    pill: 'bg-slate-100 text-slate-500',
    dot: 'bg-slate-300',
  },
};

const STATUS_ORDER: SchoolStatus[] = [
  'active',
  'trial',
  'suspended',
  'inactive',
];

interface KpiProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function KpiTile({ label, value, hint, icon, iconBg }: KpiProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {value}
          </div>
          {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: stats, isError, error } = useQuery({
    queryKey: ['school-stats'],
    queryFn: () => apiGet<SchoolStats>('/schools/stats'),
  });

  const { data: recentSchools } = useQuery({
    queryKey: ['schools', 'recent'],
    queryFn: () => apiGet<PaginatedResult<School>>('/schools?page=1&limit=6'),
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'count'],
    queryFn: () => apiGet<PaginatedResult<User>>('/users?page=1&limit=1'),
  });

  const total = stats?.total ?? 0;
  const byStatus = stats?.byStatus;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Platform overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Every school and account on AVAASchool at a glance.
          </p>
        </div>
        <Link
          to="/schools"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          + Add school
        </Link>
      </div>

      {isError && (
        <div className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </div>
      )}

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          label="Schools"
          value={total}
          hint="on the platform"
          iconBg="bg-indigo-50 text-indigo-600"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10 2 2 6v2h16V6l-8-4Zm-6 8v6H2v2h16v-2h-2v-6h-2v6h-3v-6H9v6H6v-6H4Z" />
            </svg>
          }
        />
        <KpiTile
          label="Active schools"
          value={byStatus?.active ?? 0}
          hint="running day-to-day"
          iconBg="bg-emerald-50 text-emerald-600"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1.2-5.3 5.1-5.1-1.4-1.4-3.7 3.7-1.7-1.7-1.4 1.4 3.1 3.1Z" />
            </svg>
          }
        />
        <KpiTile
          label="On trial"
          value={byStatus?.trial ?? 0}
          hint="evaluating the platform"
          iconBg="bg-sky-50 text-sky-600"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10 2a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V2Zm1 4v4.4l3.3 2-1 1.6L9 11.6V6h2Z" />
            </svg>
          }
        />
        <KpiTile
          label="Accounts"
          value={users?.total ?? '—'}
          hint="admins, teachers & parents"
          iconBg="bg-violet-50 text-violet-600"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1 16c0-2.8 2.7-5 6-5s6 2.2 6 5v1H1v-1Zm13.5-3.6c2 .4 3.5 1.9 3.5 3.6v1h-3v-1c0-1.3-.5-2.6-1.4-3.5l.9-.1Z" />
            </svg>
          }
        />
      </div>

      {/* Status distribution */}
      {byStatus && total > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-700">
            Schools by status
          </div>
          <div className="mt-3 flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
            {STATUS_ORDER.filter((s) => (byStatus[s] ?? 0) > 0).map((s) => (
              <div
                key={s}
                title={`${STATUS_META[s].label}: ${byStatus[s]}`}
                className={`${STATUS_META[s].bar} h-full rounded-sm`}
                style={{ width: `${((byStatus[s] ?? 0) / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`}
                />
                {STATUS_META[s].label}
                <span className="font-semibold text-slate-800">
                  {byStatus[s] ?? 0}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent schools + quick links */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="text-sm font-medium text-slate-700">
              Recently added schools
            </div>
            <Link
              to="/schools"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
          {recentSchools && recentSchools.data.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {recentSchools.data.map((s) => (
                <li
                  key={s._id}
                  onClick={() => navigate(`/schools/${s._id}`)}
                  className="flex cursor-pointer items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">
                      {s.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {s.code} · added{' '}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_META[s.status].pill}`}
                  >
                    {STATUS_META[s.status].label}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-8 text-center text-sm text-slate-400">
              No schools yet — add the first one.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-medium text-slate-700">
            Quick actions
          </div>
          <div className="mt-3 space-y-2">
            <Link
              to="/schools"
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                +
              </span>
              Onboard a new school
            </Link>
            <Link
              to="/users"
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M7 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM1 16c0-2.8 2.7-5 6-5s6 2.2 6 5v1H1v-1Zm14-6V7h-2v3h-3v2h3v3h2v-3h3v-2h-3Z" />
                </svg>
              </span>
              Add an account
            </Link>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Creating a school also creates its admin login — the school runs
            day-to-day work in the AVAASchool mobile app.
          </p>
        </div>
      </div>
    </div>
  );
}
