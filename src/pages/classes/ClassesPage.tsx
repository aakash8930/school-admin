import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../../lib/api';
import type { SchoolClass } from '../../lib/types';
import { ClassForm } from './ClassForm';
import { AllocateModal } from './AllocateModal';

export function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [allocating, setAllocating] = useState<SchoolClass | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<SchoolClass[]>('/classes'),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Classes</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data ? `${data.length} classes` : 'Manage classes and sections.'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add class
        </button>
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
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Academic year</th>
              <th className="px-4 py-3">Room</th>
              <th className="px-4 py-3">Occupancy</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((c) => {
                const pct = Math.min(
                  100,
                  Math.round((c.enrolled / c.capacity) * 100),
                );
                return (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {c.displayName ?? `${c.name} - ${c.section}`}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.academicYear}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.room ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full ${pct >= 100 ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {c.enrolled}/{c.capacity}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setAllocating(c)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Manage roster
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No classes yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && <ClassForm onClose={() => setShowForm(false)} />}
      {allocating && (
        <AllocateModal cls={allocating} onClose={() => setAllocating(null)} />
      )}
    </div>
  );
}
