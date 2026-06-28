import { useMemo, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPost,
  errorMessage,
} from '../../lib/api';
import type {
  PaginatedResult,
  SchoolClass,
  Student,
} from '../../lib/types';

interface Props {
  cls: SchoolClass;
  onClose: () => void;
}

export function AllocateModal({ cls, onClose }: Props) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState('');

  // Students already in this class.
  const roster = useQuery({
    queryKey: ['class-students', cls._id],
    queryFn: () => apiGet<Student[]>(`/classes/${cls._id}/students`),
  });

  // A pool of students to choose from (first 100), filtered to the unassigned.
  const pool = useQuery({
    queryKey: ['students', 'pool'],
    queryFn: () => apiGet<PaginatedResult<Student>>('/students?limit=100'),
  });

  const unassigned = useMemo(
    () => (pool.data?.data ?? []).filter((s) => !s.classId),
    [pool.data],
  );

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['class-students', cls._id] }),
      queryClient.invalidateQueries({ queryKey: ['classes'] }),
      queryClient.invalidateQueries({ queryKey: ['students'] }),
    ]);
  };

  const allocate = useMutation({
    mutationFn: (studentId: string) =>
      apiPost<Student>(`/classes/${cls._id}/allocate`, { studentId }),
    onSuccess: async () => {
      setSelected('');
      await invalidate();
    },
  });

  const deallocate = useMutation({
    mutationFn: (studentId: string) =>
      apiDelete<Student>(`/classes/${cls._id}/students/${studentId}`),
    onSuccess: invalidate,
  });

  const full = (roster.data?.length ?? 0) >= cls.capacity;
  const error = allocate.error ?? deallocate.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {cls.displayName ?? `${cls.name} - ${cls.section}`}
            </h2>
            <p className="text-xs text-slate-500">
              {roster.data?.length ?? 0} / {cls.capacity} allocated ·{' '}
              {cls.academicYear}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage(error)}
            </div>
          )}

          <div className="flex gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={full || unassigned.length === 0}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
            >
              <option value="">
                {full
                  ? 'Class is full'
                  : unassigned.length === 0
                    ? 'No unassigned students'
                    : 'Select a student to allocate…'}
              </option>
              {unassigned.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName ?? `${s.firstName} ${s.lastName}`} (
                  {s.admissionNumber})
                </option>
              ))}
            </select>
            <button
              onClick={() => selected && allocate.mutate(selected)}
              disabled={!selected || allocate.isPending || full}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Allocate
            </button>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current roster
            </div>
            {roster.isLoading ? (
              <div className="text-sm text-slate-400">Loading…</div>
            ) : roster.data && roster.data.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {roster.data.map((s) => (
                  <li
                    key={s._id}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700">
                      {s.fullName ?? `${s.firstName} ${s.lastName}`}{' '}
                      <span className="font-mono text-xs text-slate-400">
                        {s.admissionNumber}
                      </span>
                    </span>
                    <button
                      onClick={() => deallocate.mutate(s._id)}
                      disabled={deallocate.isPending}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
                No students allocated yet.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
