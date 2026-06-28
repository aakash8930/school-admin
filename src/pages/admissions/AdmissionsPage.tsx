import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, errorMessage } from '../../lib/api';
import type {
  Admission,
  AdmissionStats,
  AdmissionStatus,
  CreateInquiryInput,
  Gender,
  Inquiry,
  InquiryStatus,
  PaginatedResult,
} from '../../lib/types';

function defaultAcademicYear(): string {
  const y = new Date().getFullYear();
  return `${y}-${y + 1}`;
}

const INQUIRY_STATUS_STYLE: Record<InquiryStatus, string> = {
  new: 'bg-blue-50 text-blue-700',
  contacted: 'bg-amber-50 text-amber-700',
  visited: 'bg-indigo-50 text-indigo-700',
  converted: 'bg-green-50 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
};

const ADM_STATUS_STYLE: Record<AdmissionStatus, string> = {
  applied: 'bg-blue-50 text-blue-700',
  under_review: 'bg-indigo-50 text-indigo-700',
  approved: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
  waitlisted: 'bg-amber-50 text-amber-700',
  enrolled: 'bg-emerald-100 text-emerald-800',
  withdrawn: 'bg-slate-100 text-slate-500',
};

export function AdmissionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'inquiries' | 'applications'>('inquiries');

  const stats = useQuery({
    queryKey: ['admission-stats'],
    queryFn: () => apiGet<AdmissionStats>('/admissions/stats'),
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['inquiries'] }),
      queryClient.invalidateQueries({ queryKey: ['applications'] }),
      queryClient.invalidateQueries({ queryKey: ['admission-stats'] }),
    ]);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Admissions</h1>
      <p className="mt-1 text-sm text-slate-500">
        Inquiries, approval workflow and enrollment.
      </p>

      {stats.data && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Total
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              {stats.data.total}
            </div>
          </div>
          {(
            ['applied', 'approved', 'waitlisted', 'enrolled', 'rejected'] as AdmissionStatus[]
          ).map((s) => (
            <div
              key={s}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {s}
              </div>
              <div className="mt-1 text-xl font-semibold text-slate-900">
                {stats.data?.byStatus[s] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {(['inquiries', 'applications'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'inquiries' ? (
        <InquiriesTab onChange={invalidateAll} />
      ) : (
        <ApplicationsTab onChange={invalidateAll} />
      )}
    </div>
  );
}

function InquiriesTab({ onChange }: { onChange: () => Promise<void> }) {
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [grade, setGrade] = useState('');

  const inquiries = useQuery({
    queryKey: ['inquiries'],
    queryFn: () => apiGet<PaginatedResult<Inquiry>>('/admissions/inquiries'),
  });

  const create = useMutation({
    mutationFn: (input: CreateInquiryInput) =>
      apiPost<Inquiry>('/admissions/inquiries', input),
    onSuccess: async () => {
      setChildName('');
      setParentName('');
      setParentPhone('');
      setDob('');
      setGrade('');
      await onChange();
    },
  });

  const convert = useMutation({
    mutationFn: (id: string) =>
      apiPost(`/admissions/inquiries/${id}/convert`, {
        academicYear: defaultAcademicYear(),
      }),
    onSuccess: onChange,
  });

  const input =
    'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <div className="mt-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({
            childName: childName.trim(),
            parentName: parentName.trim(),
            parentPhone: parentPhone.trim(),
            childDateOfBirth: dob || undefined,
            gender: dob ? gender : undefined,
            gradeInterested: grade.trim() || undefined,
          });
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <input className={input} placeholder="Child name" value={childName} onChange={(e) => setChildName(e.target.value)} required />
        <input className={input} placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} required />
        <input className={input} placeholder="Phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required />
        <input className={input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} title="Child DOB (needed to convert)" />
        <select className={input} value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <input className={input} placeholder="Grade interested" value={grade} onChange={(e) => setGrade(e.target.value)} />
        <button type="submit" disabled={create.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          Add inquiry
        </button>
      </form>
      {(create.isError || convert.isError) && (
        <div className="mt-2 text-sm text-red-700">
          {errorMessage(create.error ?? convert.error)}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inquiries.data && inquiries.data.data.length > 0 ? (
              inquiries.data.data.map((i) => (
                <tr key={i._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{i.childName}</td>
                  <td className="px-4 py-3 text-slate-600">{i.parentName}<div className="text-xs text-slate-400">{i.parentPhone}</div></td>
                  <td className="px-4 py-3 text-slate-600">{i.gradeInterested ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{i.source.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${INQUIRY_STATUS_STYLE[i.status]}`}>{i.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {i.status !== 'converted' && (
                      <button
                        onClick={() => convert.mutate(i._id)}
                        disabled={convert.isPending}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Convert
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No inquiries yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApplicationsTab({ onChange }: { onChange: () => Promise<void> }) {
  const applications = useQuery({
    queryKey: ['applications'],
    queryFn: () =>
      apiGet<PaginatedResult<Admission>>('/admissions/applications'),
  });

  const decide = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdmissionStatus }) =>
      apiPatch(`/admissions/applications/${id}/decision`, { status }),
    onSuccess: onChange,
  });

  const enroll = useMutation({
    mutationFn: (id: string) =>
      apiPost(`/admissions/applications/${id}/enroll`),
    onSuccess: onChange,
  });

  const error = decide.error ?? enroll.error;

  return (
    <div className="mt-5">
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(error)}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Application</th>
              <th className="px-4 py-3">Child</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.data && applications.data.data.length > 0 ? (
              applications.data.data.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.applicationNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.firstName} {a.lastName}</td>
                  <td className="px-4 py-3 text-slate-600">{a.academicYear}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${ADM_STATUS_STYLE[a.status]}`}>{a.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {['applied', 'under_review', 'waitlisted'].includes(a.status) && (
                        <>
                          <button onClick={() => decide.mutate({ id: a._id, status: 'approved' })} className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">Approve</button>
                          <button onClick={() => decide.mutate({ id: a._id, status: 'waitlisted' })} className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">Waitlist</button>
                          <button onClick={() => decide.mutate({ id: a._id, status: 'rejected' })} className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Reject</button>
                        </>
                      )}
                      {a.status === 'approved' && (
                        <button onClick={() => enroll.mutate(a._id)} disabled={enroll.isPending} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Enroll</button>
                      )}
                      {a.status === 'enrolled' && <span className="text-xs text-emerald-700">Enrolled ✓</span>}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No applications yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
