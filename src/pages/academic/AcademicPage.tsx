import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../../lib/api';
import type {
  Assessment,
  AssessmentType,
  CreateAssessmentInput,
  CreateHomeworkInput,
  Homework,
  SchoolClass,
} from '../../lib/types';
import { ResultsModal } from './ResultsModal';

const TYPES: AssessmentType[] = [
  'quiz',
  'test',
  'exam',
  'project',
  'oral',
  'observation',
  'assignment',
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AcademicPage() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState('');
  const [grading, setGrading] = useState<Assessment | null>(null);

  const classes = useQuery({
    queryKey: ['classes'],
    queryFn: () => apiGet<SchoolClass[]>('/classes'),
  });
  useEffect(() => {
    if (!classId && classes.data && classes.data.length > 0) {
      setClassId(classes.data[0]._id);
    }
  }, [classes.data, classId]);

  const assessments = useQuery({
    queryKey: ['assessments', classId],
    queryFn: () => apiGet<Assessment[]>(`/academic/assessments?classId=${classId}`),
    enabled: !!classId,
  });
  const homework = useQuery({
    queryKey: ['homework', classId],
    queryFn: () => apiGet<Homework[]>(`/academic/homework?classId=${classId}`),
    enabled: !!classId,
  });

  // ── Create assessment ──
  const [aTitle, setATitle] = useState('');
  const [aSubject, setASubject] = useState('');
  const [aType, setAType] = useState<AssessmentType>('quiz');
  const [aMax, setAMax] = useState(10);
  const [aDate, setADate] = useState(today());

  const createAssessment = useMutation({
    mutationFn: (input: CreateAssessmentInput) =>
      apiPost<Assessment>('/academic/assessments', input),
    onSuccess: async () => {
      setATitle('');
      setASubject('');
      await queryClient.invalidateQueries({ queryKey: ['assessments', classId] });
    },
  });

  // ── Create homework ──
  const [hTitle, setHTitle] = useState('');
  const [hSubject, setHSubject] = useState('');
  const [hDue, setHDue] = useState(today());

  const createHomework = useMutation({
    mutationFn: (input: CreateHomeworkInput) =>
      apiPost<Homework>('/academic/homework', input),
    onSuccess: async () => {
      setHTitle('');
      setHSubject('');
      await queryClient.invalidateQueries({ queryKey: ['homework', classId] });
    },
  });

  const input =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Academic</h1>
          <p className="mt-1 text-sm text-slate-500">
            Assessments, results and homework.
          </p>
        </div>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={input}
        >
          {(classes.data ?? []).map((c) => (
            <option key={c._id} value={c._id}>
              {c.displayName ?? `${c.name} - ${c.section}`}
            </option>
          ))}
        </select>
      </div>

      {/* Assessments */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Assessments
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAssessment.mutate({
              title: aTitle.trim(),
              subject: aSubject.trim(),
              classId,
              type: aType,
              maxScore: aMax,
              date: aDate,
            });
          }}
          className="mt-3 flex flex-wrap items-end gap-2"
        >
          <input
            className={input}
            placeholder="Title"
            value={aTitle}
            onChange={(e) => setATitle(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Subject"
            value={aSubject}
            onChange={(e) => setASubject(e.target.value)}
            required
          />
          <select
            className={input}
            value={aType}
            onChange={(e) => setAType(e.target.value as AssessmentType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={`${input} w-24`}
            type="number"
            min={1}
            value={aMax}
            onChange={(e) => setAMax(Number(e.target.value))}
            title="Max score"
          />
          <input
            className={input}
            type="date"
            value={aDate}
            onChange={(e) => setADate(e.target.value)}
          />
          <button
            type="submit"
            disabled={createAssessment.isPending || !classId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Add
          </button>
        </form>
        {createAssessment.isError && (
          <div className="mt-2 text-sm text-red-700">
            {errorMessage(createAssessment.error)}
          </div>
        )}

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Max</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.data && assessments.data.length > 0 ? (
                assessments.data.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {a.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.subject}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">
                      {a.type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{a.maxScore}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.date.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setGrading(a)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Enter results
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    No assessments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Homework */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Homework
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createHomework.mutate({
              title: hTitle.trim(),
              subject: hSubject.trim(),
              classId,
              dueDate: hDue,
            });
          }}
          className="mt-3 flex flex-wrap items-end gap-2"
        >
          <input
            className={input}
            placeholder="Title"
            value={hTitle}
            onChange={(e) => setHTitle(e.target.value)}
            required
          />
          <input
            className={input}
            placeholder="Subject"
            value={hSubject}
            onChange={(e) => setHSubject(e.target.value)}
            required
          />
          <label className="text-xs text-slate-500">
            Due
            <input
              className={`${input} ml-2`}
              type="date"
              value={hDue}
              onChange={(e) => setHDue(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={createHomework.isPending || !classId}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Add
          </button>
        </form>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {homework.data && homework.data.length > 0 ? (
                homework.data.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {h.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{h.subject}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {h.assignedDate.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {h.dueDate.slice(0, 10)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No homework yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {grading && (
        <ResultsModal assessment={grading} onClose={() => setGrading(null)} />
      )}
    </div>
  );
}
