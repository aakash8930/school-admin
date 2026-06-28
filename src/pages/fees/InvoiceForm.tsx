import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../../lib/api';
import type {
  CreateInvoiceInput,
  FeeComponent,
  Invoice,
  PaginatedResult,
  Student,
} from '../../lib/types';

function defaultAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

interface Props {
  onClose: () => void;
}

export function InvoiceForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear());
  const [period, setPeriod] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lines, setLines] = useState<FeeComponent[]>([
    { name: '', amount: 0 },
  ]);

  const students = useQuery({
    queryKey: ['students', 'pool'],
    queryFn: () => apiGet<PaginatedResult<Student>>('/students?limit=100'),
  });

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const mutation = useMutation({
    mutationFn: (input: CreateInvoiceInput) =>
      apiPost<Invoice>('/fees/invoices', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fees-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['fees-reports'] }),
      ]);
      onClose();
    },
  });

  const setLine = (i: number, patch: Partial<FeeComponent>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      studentId,
      academicYear,
      period: period.trim(),
      dueDate,
      lineItems: lines
        .filter((l) => l.name.trim() && Number(l.amount) > 0)
        .map((l) => ({ name: l.name.trim(), amount: Number(l.amount) })),
    });
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New invoice</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-6 py-5">
            {mutation.isError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(mutation.error)}
              </div>
            )}

            <label className={label}>
              Student
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                className={field}
              >
                <option value="">Select a student…</option>
                {(students.data?.data ?? []).map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName ?? `${s.firstName} ${s.lastName}`} (
                    {s.admissionNumber})
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Academic year
                <input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={field}
                  required
                />
              </label>
              <label className={label}>
                Period
                <input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Term 1"
                  className={field}
                  required
                />
              </label>
            </div>

            <label className={label}>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={field}
                required
              />
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Line items
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setLines((ls) => [...ls, { name: '', amount: 0 }])
                  }
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  + Add line
                </button>
              </div>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={l.name}
                      onChange={(e) => setLine(i, { name: e.target.value })}
                      placeholder="Tuition"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={l.amount}
                      onChange={(e) =>
                        setLine(i, { amount: Number(e.target.value) })
                      }
                      className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setLines((ls) => ls.filter((_, idx) => idx !== i))
                        }
                        className="rounded px-2 text-slate-400 hover:bg-slate-100"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 text-right text-sm font-semibold text-slate-800">
                Total: ₹{total}
              </div>
            </div>
          </div>

          <div className="mt-auto flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || total <= 0 || !studentId}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Creating…' : 'Create invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
