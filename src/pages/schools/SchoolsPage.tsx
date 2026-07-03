import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../../lib/api';
import type {
  PaginatedResult,
  School,
  SchoolStats,
  SchoolStatus,
} from '../../lib/types';
import { SchoolForm } from './SchoolForm';

const STATUS_OPTIONS: { value: '' | SchoolStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'trial', label: 'Trial' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
];

const STATUS_STYLES: Record<SchoolStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  trial: 'bg-sky-50 text-sky-700',
  suspended: 'bg-amber-50 text-amber-700',
  inactive: 'bg-slate-100 text-slate-500',
};

export function SchoolsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | SchoolStatus>('');
  const [showForm, setShowForm] = useState(false);
  const limit = 20;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['schools', page, search, status],
    queryFn: () =>
      apiGet<PaginatedResult<School>>(`/schools?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  const { data: stats } = useQuery({
    queryKey: ['school-stats'],
    queryFn: () => apiGet<SchoolStats>('/schools/stats'),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Schools</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stats
              ? `${stats.total} schools on the platform`
              : 'Manage the schools on the platform.'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add school
        </button>
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(STATUS_STYLES) as SchoolStatus[]).map((s) => (
            <div
              key={s}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {s}
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {stats.byStatus[s] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search name or code…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | SchoolStatus);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
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
              data.data.map((s) => (
                <tr
                  key={s._id}
                  onClick={() => navigate(`/schools/${s._id}`)}
                  className="cursor-pointer transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600">
                        {s.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">
                          {s.name}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          {s.code}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.contactEmail ?? s.contactPhone ?? (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.address?.city ?? (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No schools found.
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

      {showForm && <SchoolForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
