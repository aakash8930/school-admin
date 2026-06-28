import { useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../lib/api';
import type { DashboardOverview } from '../lib/types';

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet<DashboardOverview>('/dashboard'),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Overview of your school at a glance.
      </p>

      {isLoading && (
        <div className="mt-6 text-sm text-slate-500">Loading metrics…</div>
      )}

      {isError && (
        <div className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </div>
      )}

      {data && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Students"
              value={data.students.total}
              hint={`${data.students.active} active`}
            />
            <StatCard
              label="Staff"
              value={data.staff.total}
              hint={`${data.staff.present} present today`}
            />
            <StatCard
              label="Fees collected today"
              value={data.fees.collectedToday}
              hint={`${data.fees.pending} pending`}
            />
            <StatCard
              label="Present today"
              value={data.attendance.presentToday}
              hint={`${data.attendance.absentToday} absent`}
            />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Generated at {new Date(data.generatedAt).toLocaleString()}
          </p>
        </>
      )}
    </div>
  );
}
