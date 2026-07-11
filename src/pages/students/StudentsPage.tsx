import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../../lib/api';
import type {
  PaginatedResult,
  Student,
  StudentStats,
  StudentStatus,
} from '../../lib/types';

const STATUS_OPTIONS: { value: '' | StudentStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'graduated', label: 'Graduated' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'suspended', label: 'Suspended' },
];

const STATUS_STYLES: Record<StudentStatus, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  graduated: 'bg-blue-50 text-blue-700',
  withdrawn: 'bg-amber-50 text-amber-700',
  suspended: 'bg-red-50 text-red-700',
};

function calcAge(dob: string): number {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

export function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | StudentStatus>('');
  const limit = 20;

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['students', page, search, status],
    queryFn: () =>
      apiGet<PaginatedResult<Student>>(`/students?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  const { data: stats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => apiGet<StudentStats>('/students/stats'),
  });

  return (
    <div>
      {/* Read-only roster: students are enrolled by their school's admin in
          the app, never by the super admin. */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Students</h1>
        <p className="mt-1 text-sm text-slate-500">
          {stats ? `${stats.total} enrolled` : 'The student roster.'} Students
          are added by each school&apos;s admin.
        </p>
      </div>

      {stats && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(STATUS_STYLES) as StudentStatus[]).map((s) => (
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
          placeholder="Search name or admission no.…"
          className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | StudentStatus);
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
              <th className="px-4 py-3">Admission No.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Age</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data && data.data.length > 0 ? (
              data.data.map((s) => {
                const primary =
                  s.guardians?.find((g) => g.isPrimary) ?? s.guardians?.[0];
                return (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {s.admissionNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {s.fullName ?? `${s.firstName} ${s.lastName}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {calcAge(s.dateOfBirth)}
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {s.gender}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {primary ? (
                        <span>
                          {primary.name}{' '}
                          <span className="text-slate-400">
                            ({primary.relationship})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs capitalize ${STATUS_STYLES[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No students found.
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
    </div>
  );
}
