import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../../lib/api';
import type {
  PaginatedResult,
  SchoolOverview,
  SchoolStatus,
  User,
} from '../../lib/types';

const STATUS_STYLES: Record<SchoolStatus, string> = {
  active: 'bg-green-50 text-green-700',
  trial: 'bg-blue-50 text-blue-700',
  suspended: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-800">
        {value || <span className="text-slate-400">—</span>}
      </dd>
    </div>
  );
}

export function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: overview,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['school-overview', id],
    queryFn: () => apiGet<SchoolOverview>(`/schools/${id}/overview`),
    enabled: Boolean(id),
  });

  const { data: users } = useQuery({
    queryKey: ['users', 'school', id],
    queryFn: () =>
      apiGet<PaginatedResult<User>>(`/users?schoolId=${id}&limit=100`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading…</div>;
  }
  if (isError || !overview) {
    return (
      <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        {isError ? errorMessage(error) : 'School not found.'}
      </div>
    );
  }

  const { school, students, usersByRole } = overview;
  const address = school.address;
  const addressText = address
    ? [address.line1, address.line2, address.city, address.state, address.country]
        .filter(Boolean)
        .join(', ')
    : '';

  const counts: { label: string; value: number }[] = [
    { label: 'Students', value: students },
    { label: 'Teachers', value: usersByRole.teacher ?? 0 },
    { label: 'Parents', value: usersByRole.parent ?? 0 },
    {
      label: 'Accounts',
      value: Object.values(usersByRole).reduce((a, b) => a + (b ?? 0), 0),
    },
  ];

  return (
    <div>
      <Link
        to="/schools"
        className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Schools
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {school.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-mono">{school.code}</span> · joined{' '}
            {new Date(school.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`rounded px-2.5 py-1 text-sm capitalize ${STATUS_STYLES[school.status]}`}
        >
          {school.status}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {c.label}
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">School info</h2>
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoRow label="Contact email" value={school.contactEmail} />
          <InfoRow label="Contact phone" value={school.contactPhone} />
          <InfoRow label="Address" value={addressText} />
          <InfoRow
            label="Enabled modules"
            value={
              school.enabledModules.length
                ? school.enabledModules.join(', ')
                : 'All'
            }
          />
          <InfoRow label="Active" value={school.isActive ? 'Yes' : 'No'} />
        </dl>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Accounts</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Everyone who signs in under this school.
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Last login</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users && users.data.length > 0 ? (
              users.data.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-600">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.lastLoginAt ? (
                      new Date(u.lastLoginAt).toLocaleString()
                    ) : (
                      <span className="text-slate-400">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        u.isActive
                          ? 'bg-green-50 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No accounts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
