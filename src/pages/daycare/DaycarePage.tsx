import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, errorMessage } from '../../lib/api';
import type {
  DaycareDiary,
  DaycareEntryType,
  PaginatedResult,
  Student,
} from '../../lib/types';
import { DaycareEntryModal } from './DaycareEntryModal';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SectionProps {
  title: string;
  type: DaycareEntryType;
  items: { _id: string }[];
  render: (item: never) => React.ReactNode;
  onDelete: (type: DaycareEntryType, id: string) => void;
}

function Section({ title, type, items, render, onDelete }: SectionProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}{' '}
        <span className="ml-1 text-slate-400">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">Nothing logged.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((item) => (
            <li
              key={item._id}
              className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="text-slate-700">{render(item as never)}</div>
              <button
                onClick={() => onDelete(type, item._id)}
                className="shrink-0 rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-100"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DaycarePage() {
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [date, setDate] = useState(today());
  const [showModal, setShowModal] = useState(false);

  const students = useQuery({
    queryKey: ['students', 'pool'],
    queryFn: () => apiGet<PaginatedResult<Student>>('/students?limit=100'),
  });

  useEffect(() => {
    if (!studentId && students.data && students.data.data.length > 0) {
      setStudentId(students.data.data[0]._id);
    }
  }, [students.data, studentId]);

  const diary = useQuery({
    queryKey: ['daycare-diary', studentId, date],
    queryFn: () =>
      apiGet<DaycareDiary>(`/daycare/diary/${studentId}?date=${date}`),
    enabled: !!studentId,
  });

  const del = useMutation({
    mutationFn: ({ type, id }: { type: DaycareEntryType; id: string }) =>
      apiDelete(`/daycare/${type}/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['daycare-diary'] }),
  });

  const onDelete = (type: DaycareEntryType, id: string) =>
    del.mutate({ type, id });

  const d = diary.data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Daycare</h1>
          <p className="mt-1 text-sm text-slate-500">
            Digital preschool diary — meals, naps, activities, health & mood.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!studentId}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          + Add entry
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {(students.data?.data ?? []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.fullName ?? `${s.firstName} ${s.lastName}`}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {diary.isError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(diary.error)}
        </div>
      )}

      {d && (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section
            title="Meals"
            type="meals"
            items={d.meals}
            onDelete={onDelete}
            render={(m: DaycareDiary['meals'][number]) => (
              <span>
                <span className="font-medium capitalize">
                  {m.mealType.replace('_', ' ')}
                </span>{' '}
                — {m.menu}{' '}
                <span className="text-slate-400">({m.amountEaten})</span>
              </span>
            )}
          />
          <Section
            title="Naps"
            type="naps"
            items={d.naps}
            onDelete={onDelete}
            render={(n: DaycareDiary['naps'][number]) => (
              <span>
                {n.durationMinutes} min{' '}
                <span className="text-slate-400">({n.quality})</span>
              </span>
            )}
          />
          <Section
            title="Activities"
            type="activities"
            items={d.activities}
            onDelete={onDelete}
            render={(a: DaycareDiary['activities'][number]) => (
              <span>
                <span className="font-medium">{a.title}</span>{' '}
                <span className="text-slate-400">({a.category})</span>
              </span>
            )}
          />
          <Section
            title="Health"
            type="health"
            items={d.health}
            onDelete={onDelete}
            render={(h: DaycareDiary['health'][number]) => (
              <span>
                <span className="font-medium capitalize">{h.type}</span> —{' '}
                {h.description}
                {h.temperature ? ` (${h.temperature}°C)` : ''}{' '}
                <span className="text-slate-400">[{h.severity}]</span>
              </span>
            )}
          />
          <Section
            title="Observations"
            type="observations"
            items={d.observations}
            onDelete={onDelete}
            render={(o: DaycareDiary['observations'][number]) => (
              <span>
                <span className="font-medium capitalize">{o.mood}</span> —{' '}
                {o.observation}
              </span>
            )}
          />
        </div>
      )}

      {showModal && studentId && (
        <DaycareEntryModal
          studentId={studentId}
          date={date}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
