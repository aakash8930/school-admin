import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, errorMessage } from '../../lib/api';
import type {
  AlertSeverity,
  Circular,
  CircularAudience,
  CreateAlertInput,
  CreateCircularInput,
  EmergencyAlert,
  PtmRequest,
  PtmStatus,
} from '../../lib/types';

const AUDIENCES: CircularAudience[] = [
  'all',
  'parents',
  'teachers',
  'staff',
];
const SEVERITIES: AlertSeverity[] = ['info', 'warning', 'critical'];

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-red-50 text-red-700',
};

const PTM_STYLE: Record<PtmStatus, string> = {
  requested: 'bg-blue-50 text-blue-700',
  scheduled: 'bg-green-50 text-green-700',
  declined: 'bg-red-50 text-red-700',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-500',
};

export function CommunicationPage() {
  const [tab, setTab] = useState<'circulars' | 'alerts' | 'ptm'>('circulars');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Communication</h1>
      <p className="mt-1 text-sm text-slate-500">
        Circulars, emergency broadcasts and parent-teacher meetings.
      </p>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {(['circulars', 'alerts', 'ptm'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize ${
              tab === t
                ? 'border-b-2 border-indigo-600 text-indigo-700'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'ptm' ? 'PTM requests' : t}
          </button>
        ))}
      </div>

      {tab === 'circulars' && <CircularsTab />}
      {tab === 'alerts' && <AlertsTab />}
      {tab === 'ptm' && <PtmTab />}
    </div>
  );
}

const input =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

function CircularsTab() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<CircularAudience>('all');

  const list = useQuery({
    queryKey: ['circulars'],
    queryFn: () => apiGet<Circular[]>('/communication/circulars'),
  });

  const create = useMutation({
    mutationFn: (i: CreateCircularInput) =>
      apiPost<Circular>('/communication/circulars', i),
    onSuccess: async () => {
      setTitle('');
      setBody('');
      await queryClient.invalidateQueries({ queryKey: ['circulars'] });
    },
  });

  return (
    <div className="mt-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ title: title.trim(), body: body.trim(), audience });
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <input className={`${input} flex-1`} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select className={input} value={audience} onChange={(e) => setAudience(e.target.value as CircularAudience)}>
            {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button type="submit" disabled={create.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">Publish</button>
        </div>
        <textarea className={`${input} w-full`} rows={2} placeholder="Message body" value={body} onChange={(e) => setBody(e.target.value)} required />
      </form>
      {create.isError && <div className="mt-2 text-sm text-red-700">{errorMessage(create.error)}</div>}

      <div className="mt-4 space-y-2">
        {(list.data ?? []).map((c) => (
          <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-800">{c.title}</h3>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500">{c.audience}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{c.body}</p>
            <div className="mt-1 text-xs text-slate-400">{new Date(c.publishedAt).toLocaleString()}</div>
          </div>
        ))}
        {list.data && list.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">No circulars yet.</div>
        )}
      </div>
    </div>
  );
}

function AlertsTab() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertSeverity>('warning');

  const list = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiGet<EmergencyAlert[]>('/communication/alerts'),
  });

  const create = useMutation({
    mutationFn: (i: CreateAlertInput) =>
      apiPost<EmergencyAlert>('/communication/alerts', i),
    onSuccess: async () => {
      setTitle('');
      setMessage('');
      await queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  return (
    <div className="mt-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate({ title: title.trim(), message: message.trim(), severity });
        }}
        className="space-y-2"
      >
        <div className="flex gap-2">
          <input className={`${input} flex-1`} placeholder="Alert title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <select className={input} value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity)}>
            {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" disabled={create.isPending} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">Broadcast</button>
        </div>
        <textarea className={`${input} w-full`} rows={2} placeholder="Emergency message" value={message} onChange={(e) => setMessage(e.target.value)} required />
      </form>
      {create.isError && <div className="mt-2 text-sm text-red-700">{errorMessage(create.error)}</div>}

      <div className="mt-4 space-y-2">
        {(list.data ?? []).map((a) => (
          <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-800">{a.title}</h3>
              <span className={`rounded px-2 py-0.5 text-xs capitalize ${SEVERITY_STYLE[a.severity]}`}>{a.severity}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{a.message}</p>
            <div className="mt-1 text-xs text-slate-400">{new Date(a.sentAt).toLocaleString()}</div>
          </div>
        ))}
        {list.data && list.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">No alerts sent.</div>
        )}
      </div>
    </div>
  );
}

function PtmTab() {
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ['ptm-all'],
    queryFn: () => apiGet<PtmRequest[]>('/communication/ptm'),
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PtmStatus }) =>
      apiPatch(`/communication/ptm/${id}/respond`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ptm-all'] }),
  });

  return (
    <div className="mt-5">
      {respond.isError && <div className="mb-3 text-sm text-red-700">{errorMessage(respond.error)}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Preferred</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.data && list.data.length > 0 ? (
              list.data.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700">{p.reason}</td>
                  <td className="px-4 py-3 text-slate-500">{p.preferredSlots.join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs capitalize ${PTM_STYLE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {(p.status === 'requested') && (
                        <>
                          <button onClick={() => respond.mutate({ id: p._id, status: 'scheduled' })} className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">Schedule</button>
                          <button onClick={() => respond.mutate({ id: p._id, status: 'declined' })} className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">Decline</button>
                        </>
                      )}
                      {p.status === 'scheduled' && (
                        <button onClick={() => respond.mutate({ id: p._id, status: 'completed' })} className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Mark done</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No PTM requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
