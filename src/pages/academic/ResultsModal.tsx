import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../../lib/api';
import type { Assessment, EnterResultsInput, Result, Student } from '../../lib/types';

interface Props {
  assessment: Assessment;
  onClose: () => void;
}

export function ResultsModal({ assessment, onClose }: Props) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, string>>({});

  const roster = useQuery({
    queryKey: ['class-students', assessment.classId],
    queryFn: () =>
      apiGet<Student[]>(`/classes/${assessment.classId}/students`),
  });

  const existing = useQuery({
    queryKey: ['assessment-results', assessment._id],
    queryFn: () =>
      apiGet<Result[]>(`/academic/assessments/${assessment._id}/results`),
  });

  // Seed inputs from any results already entered.
  useEffect(() => {
    if (existing.data) {
      const seed: Record<string, string> = {};
      for (const r of existing.data) seed[r.student] = String(r.score);
      setScores(seed);
    }
  }, [existing.data]);

  const mutation = useMutation({
    mutationFn: (input: EnterResultsInput) =>
      apiPost<Result[]>('/academic/results', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['assessment-results', assessment._id],
      });
      onClose();
    },
  });

  const handleSave = () => {
    const entries = Object.entries(scores)
      .filter(([, v]) => v !== '')
      .map(([studentId, v]) => ({ studentId, score: Number(v) }));
    if (entries.length === 0) return;
    mutation.mutate({ assessmentId: assessment._id, entries });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {assessment.title}
            </h2>
            <p className="text-xs text-slate-500">
              {assessment.subject} · max {assessment.maxScore}
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

        <div className="overflow-y-auto px-6 py-5">
          {mutation.isError && (
            <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage(mutation.error)}
            </div>
          )}
          {roster.isLoading ? (
            <div className="text-sm text-slate-400">Loading roster…</div>
          ) : roster.data && roster.data.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {roster.data.map((s) => (
                <li
                  key={s._id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-slate-700">
                    {s.fullName ?? `${s.firstName} ${s.lastName}`}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={assessment.maxScore}
                    value={scores[s._id] ?? ''}
                    onChange={(e) =>
                      setScores((sc) => ({ ...sc, [s._id]: e.target.value }))
                    }
                    placeholder="—"
                    className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-400">
              No students allocated to this class.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {mutation.isPending ? 'Saving…' : 'Save results'}
          </button>
        </div>
      </div>
    </div>
  );
}
