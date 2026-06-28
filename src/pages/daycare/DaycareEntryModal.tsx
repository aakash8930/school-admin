import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, errorMessage } from '../../lib/api';
import type { DaycareEntryType } from '../../lib/types';

const ENTRY_TYPES: { value: DaycareEntryType; label: string }[] = [
  { value: 'meals', label: 'Meal' },
  { value: 'naps', label: 'Nap' },
  { value: 'activities', label: 'Activity' },
  { value: 'health', label: 'Health' },
  { value: 'observations', label: 'Observation' },
];

interface Props {
  studentId: string;
  date: string;
  onClose: () => void;
}

export function DaycareEntryModal({ studentId, date, onClose }: Props) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<DaycareEntryType>('meals');
  // Shared free-form fields; each type reads what it needs.
  const [form, setForm] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => {
      const base = { studentId, date };
      let payload: Record<string, unknown>;
      switch (type) {
        case 'meals':
          payload = {
            ...base,
            mealType: form.mealType || 'lunch',
            menu: form.menu ?? '',
            amountEaten: form.amountEaten || 'most',
          };
          break;
        case 'naps':
          payload = {
            ...base,
            startTime: form.startTime
              ? new Date(`${date}T${form.startTime}:00`).toISOString()
              : undefined,
            endTime: form.endTime
              ? new Date(`${date}T${form.endTime}:00`).toISOString()
              : undefined,
            quality: form.quality || 'sound',
          };
          break;
        case 'activities':
          payload = {
            ...base,
            title: form.title ?? '',
            category: form.category || 'play',
            description: form.description || undefined,
          };
          break;
        case 'health':
          payload = {
            ...base,
            type: form.healthType || 'general',
            description: form.description ?? '',
            temperature: form.temperature
              ? Number(form.temperature)
              : undefined,
            severity: form.severity || 'info',
          };
          break;
        case 'observations':
          payload = {
            ...base,
            mood: form.mood || 'happy',
            observation: form.observation ?? '',
          };
          break;
      }
      return apiPost(`/daycare/${type}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['daycare-diary'] });
      onClose();
    },
  });

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Add daycare entry
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4 px-6 py-5"
        >
          {mutation.isError && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage(mutation.error)}
            </div>
          )}

          <label className={label}>
            Type
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as DaycareEntryType);
                setForm({});
              }}
              className={field}
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {type === 'meals' && (
            <>
              <label className={label}>
                Meal
                <select
                  className={field}
                  value={form.mealType ?? 'lunch'}
                  onChange={(e) => set('mealType', e.target.value)}
                >
                  {['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner'].map(
                    (m) => (
                      <option key={m} value={m}>
                        {m.replace('_', ' ')}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className={label}>
                Menu
                <input
                  className={field}
                  value={form.menu ?? ''}
                  onChange={(e) => set('menu', e.target.value)}
                  required
                />
              </label>
              <label className={label}>
                Amount eaten
                <select
                  className={field}
                  value={form.amountEaten ?? 'most'}
                  onChange={(e) => set('amountEaten', e.target.value)}
                >
                  {['all', 'most', 'some', 'none', 'refused'].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {type === 'naps' && (
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Start
                <input
                  type="time"
                  className={field}
                  value={form.startTime ?? ''}
                  onChange={(e) => set('startTime', e.target.value)}
                />
              </label>
              <label className={label}>
                End
                <input
                  type="time"
                  className={field}
                  value={form.endTime ?? ''}
                  onChange={(e) => set('endTime', e.target.value)}
                />
              </label>
              <label className={`${label} col-span-2`}>
                Quality
                <select
                  className={field}
                  value={form.quality ?? 'sound'}
                  onChange={(e) => set('quality', e.target.value)}
                >
                  {['sound', 'restless', 'no_nap'].map((q) => (
                    <option key={q} value={q}>
                      {q.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {type === 'activities' && (
            <>
              <label className={label}>
                Title
                <input
                  className={field}
                  value={form.title ?? ''}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </label>
              <label className={label}>
                Category
                <select
                  className={field}
                  value={form.category ?? 'play'}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {['art', 'music', 'play', 'learning', 'outdoor', 'story', 'other'].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </>
          )}

          {type === 'health' && (
            <>
              <label className={label}>
                Type
                <select
                  className={field}
                  value={form.healthType ?? 'general'}
                  onChange={(e) => set('healthType', e.target.value)}
                >
                  {['temperature', 'medication', 'incident', 'symptom', 'general'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className={label}>
                Description
                <input
                  className={field}
                  value={form.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={label}>
                  Temp (°C)
                  <input
                    type="number"
                    step="0.1"
                    className={field}
                    value={form.temperature ?? ''}
                    onChange={(e) => set('temperature', e.target.value)}
                  />
                </label>
                <label className={label}>
                  Severity
                  <select
                    className={field}
                    value={form.severity ?? 'info'}
                    onChange={(e) => set('severity', e.target.value)}
                  >
                    {['info', 'attention', 'urgent'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}

          {type === 'observations' && (
            <>
              <label className={label}>
                Mood
                <select
                  className={field}
                  value={form.mood ?? 'happy'}
                  onChange={(e) => set('mood', e.target.value)}
                >
                  {['happy', 'calm', 'cranky', 'tired', 'upset', 'energetic'].map(
                    (m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className={label}>
                Observation
                <textarea
                  className={field}
                  rows={2}
                  value={form.observation ?? ''}
                  onChange={(e) => set('observation', e.target.value)}
                  required
                />
              </label>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              {mutation.isPending ? 'Saving…' : 'Add entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
