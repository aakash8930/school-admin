import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../../lib/api';
import type {
  AttendanceSheetRow,
  AttendanceStatus,
  MarkAttendanceInput,
  SchoolClass,
} from '../../lib/types';

const MARKABLE: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day'];

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  present: 'bg-green-600 text-white',
  absent: 'bg-red-600 text-white',
  late: 'bg-amber-500 text-white',
  half_day: 'bg-blue-600 text-white',
  on_leave: 'bg-slate-500 text-white',
  holiday: 'bg-slate-400 text-white',
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AttendancePage() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(today());
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});

  const classes = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<SchoolClass[]>('/classes'),
  });

  // Default to the first class once loaded.
  useEffect(() => {
    if (!classId && classes.data && classes.data.length > 0) {
      setClassId(classes.data[0]._id);
    }
  }, [classes.data, classId]);

  const sheet = useQuery({
    queryKey: ['attendance-sheet', classId, date],
    queryFn: () =>
      apiGet<AttendanceSheetRow[]>(
        `/attendance/class/${classId}?date=${date}`,
      ),
    enabled: !!classId,
  });

  // Seed the local draft from the loaded sheet whenever it changes.
  useEffect(() => {
    if (sheet.data) {
      const seed: Record<string, AttendanceStatus> = {};
      for (const row of sheet.data) {
        if (row.status) seed[row.student._id] = row.status;
      }
      setDraft(seed);
    }
  }, [sheet.data]);

  const save = useMutation({
    mutationFn: (input: MarkAttendanceInput) =>
      apiPost('/attendance/mark', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['attendance-sheet', classId, date],
      });
    },
  });

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, half_day: 0, unmarked: 0 };
    for (const row of sheet.data ?? []) {
      const s = draft[row.student._id];
      if (s === 'present') c.present++;
      else if (s === 'absent') c.absent++;
      else if (s === 'late') c.late++;
      else if (s === 'half_day') c.half_day++;
      else c.unmarked++;
    }
    return c;
  }, [sheet.data, draft]);

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    setDraft((d) => ({ ...d, [studentId]: status }));

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {};
    for (const row of sheet.data ?? []) next[row.student._id] = status;
    setDraft(next);
  };

  const handleSave = () => {
    const entries = Object.entries(draft).map(([studentId, status]) => ({
      studentId,
      status,
    }));
    if (entries.length === 0) return;
    save.mutate({ classId, date, entries });
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mark and review daily student attendance.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {(classes.data ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.displayName ?? `${c.name} - ${c.section}`} ({c.academicYear})
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => markAll('present')}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Mark all present
          </button>
          <button
            onClick={handleSave}
            disabled={save.isPending || !classId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {save.isPending ? 'Saving…' : 'Save attendance'}
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ['Present', counts.present],
            ['Absent', counts.absent],
            ['Late', counts.late],
            ['Half day', counts.half_day],
            ['Unmarked', counts.unmarked],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div className="text-xs uppercase tracking-wide text-slate-400">
              {label}
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {value}
            </div>
          </div>
        ))}
      </div>

      {(classes.isError || sheet.isError) && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(classes.error ?? sheet.error)}
        </div>
      )}
      {save.isError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(save.error)}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Admission No.</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!classId || sheet.isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  {classId ? 'Loading…' : 'Select a class.'}
                </td>
              </tr>
            ) : sheet.data && sheet.data.length > 0 ? (
              sheet.data.map((row) => (
                <tr key={row.student._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {row.student.fullName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {row.student.admissionNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {MARKABLE.map((s) => {
                        const active = draft[row.student._id] === s;
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(row.student._id, s)}
                            className={`rounded px-2 py-1 text-xs font-medium capitalize transition ${
                              active
                                ? STATUS_STYLE[s]
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  No students in this class. Allocate students first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
