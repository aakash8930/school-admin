import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiGet, errorMessage } from '../../lib/api';
import type {
  CollectionReport,
  FeeStatus,
  Invoice,
  OutstandingReport,
  PaginatedResult,
  Student,
} from '../../lib/types';
import { PaymentModal } from './PaymentModal';
import { InvoiceForm } from './InvoiceForm';

const STATUS_OPTIONS: { value: '' | FeeStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const STATUS_STYLE: Record<FeeStatus, string> = {
  pending: 'bg-amber-50 text-amber-700',
  partial: 'bg-blue-50 text-blue-700',
  paid: 'bg-green-50 text-green-700',
  overdue: 'bg-red-50 text-red-700',
  waived: 'bg-slate-100 text-slate-500',
  refunded: 'bg-slate-100 text-slate-500',
};

export function FeesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | FeeStatus>('');
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const limit = 20;

  const collection = useQuery({
    queryKey: ['fees-reports', 'collection'],
    queryFn: () => apiGet<CollectionReport>('/fees/reports/collection'),
  });
  const outstanding = useQuery({
    queryKey: ['fees-reports', 'outstanding'],
    queryFn: () => apiGet<OutstandingReport>('/fees/reports/outstanding'),
  });

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);

  const invoices = useQuery({
    queryKey: ['fees-invoices', page, status],
    queryFn: () =>
      apiGet<PaginatedResult<Invoice>>(`/fees/invoices?${params.toString()}`),
    placeholderData: keepPreviousData,
  });

  // Resolve student names for display.
  const studentsQ = useQuery({
    queryKey: ['students', 'pool'],
    queryFn: () => apiGet<PaginatedResult<Student>>('/students?limit=100'),
  });
  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of studentsQ.data?.data ?? []) {
      m.set(s._id, s.fullName ?? `${s.firstName} ${s.lastName}`);
    }
    return m;
  }, [studentsQ.data]);

  const data = invoices.data;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Fees</h1>
          <p className="mt-1 text-sm text-slate-500">
            Invoices, payments and collections.
          </p>
        </div>
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New invoice
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Total collected</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            ₹{collection.data?.totalCollected ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {collection.data?.paymentCount ?? 0} payments
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Outstanding</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            ₹{outstanding.data?.totalOutstanding ?? 0}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {outstanding.data?.outstandingInvoices ?? 0} unpaid invoices
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm text-slate-500">Collection by method</div>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            {Object.entries(collection.data?.byMethod ?? {}).length > 0 ? (
              Object.entries(collection.data?.byMethod ?? {}).map(([m, v]) => (
                <div key={m} className="flex justify-between">
                  <span className="capitalize">{m.replace('_', ' ')}</span>
                  <span className="font-medium">₹{v}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400">No payments yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | FeeStatus);
            setPage(1);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {invoices.isError && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage(invoices.error)}
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Balance</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : data && data.data.length > 0 ? (
              data.data.map((inv) => {
                const balance =
                  inv.balance ?? inv.totalAmount - inv.amountPaid;
                return (
                  <tr key={inv._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {nameById.get(inv.student) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.period}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      ₹{inv.totalAmount}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      ₹{balance}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs capitalize ${STATUS_STYLE[inv.status]}`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {balance > 0 ? (
                        <button
                          onClick={() => setPaying(inv)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Record payment
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Settled</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {data.page} of {data.totalPages} · {data.total} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || invoices.isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages || invoices.isFetching}
              className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {paying && (
        <PaymentModal
          invoice={paying}
          studentName={nameById.get(paying.student) ?? 'Student'}
          onClose={() => setPaying(null)}
        />
      )}
      {showInvoiceForm && (
        <InvoiceForm onClose={() => setShowInvoiceForm(false)} />
      )}
    </div>
  );
}
