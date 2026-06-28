import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, errorMessage } from '../../lib/api';
import type { CreateClassInput, SchoolClass } from '../../lib/types';

function defaultAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

interface Props {
  onClose: () => void;
}

export function ClassForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear());
  const [capacity, setCapacity] = useState(30);
  const [room, setRoom] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateClassInput) =>
      apiPost<SchoolClass>('/classes', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['classes'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateClassInput = {
      name: name.trim(),
      section: section.trim() || 'A',
      academicYear: academicYear.trim(),
      capacity,
    };
    if (room.trim()) input.room = room.trim();
    mutation.mutate(input);
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New class</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="space-y-4 px-6 py-5">
            {mutation.isError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(mutation.error)}
              </div>
            )}

            <label className={label}>
              Class name
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grade 1"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Section
                <input
                  className={field}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                />
              </label>
              <label className={label}>
                Academic year
                <input
                  className={field}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2026-2027"
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Capacity
                <input
                  type="number"
                  min={1}
                  max={200}
                  className={field}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                />
              </label>
              <label className={label}>
                Room
                <input
                  className={field}
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="101"
                />
              </label>
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
              disabled={mutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Saving…' : 'Create class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
