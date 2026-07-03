import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../lib/api';
import type { PaginatedResult, School, User, UserRole } from '../lib/types';
import { UserForm } from './UserForm';

// Role pill colors — one hue per role, applied consistently everywhere.
const ROLE_STYLES: Partial<Record<UserRole, string>> = {
  super_admin: 'bg-slate-900 text-white',
  admin: 'bg-indigo-50 text-indigo-700',
  teacher: 'bg-emerald-50 text-emerald-700',
  parent: 'bg-violet-50 text-violet-700',
};

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const limit = 20;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['users', page],
    queryFn: () =>
      apiGet<PaginatedResult<User>>(`/users?page=${page}&limit=${limit}`),
    placeholderData: keepPreviousData,
  });

  // Map schoolId → school so each account shows which school it belongs to.
  const { data: schools } = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => apiGet<PaginatedResult<School>>('/schools?limit=100'),
  });
  const schoolById = useMemo(() => {
    const map = new Map<string, School>();
    for (const s of schools?.data ?? []) map.set(s._id, s);
    return map;
  }, [schools]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            All accounts across the platform (schools, staff, parents).
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add user
        </button>
      </div>

      {isError && (
        <div className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email / Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data && data.data.length > 0 ? (
              data.data.map((u) => (
                <tr key={u._id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.email || u.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        ROLE_STYLES[u.role] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.schoolId ? (
                      (schoolById.get(u.schoolId)?.name ?? (
                        <span className="font-mono text-xs">{u.schoolId}</span>
                      ))
                    ) : (
                      <span className="text-slate-400">Platform</span>
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
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {data.totalPages} · {data.total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages || isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showForm && <UserForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
