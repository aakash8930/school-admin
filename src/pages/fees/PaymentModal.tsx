import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, errorMessage } from '../../lib/api';
import type {
  Invoice,
  PaymentMethod,
  PaymentResult,
  RecordPaymentInput,
} from '../../lib/types';

const METHODS: PaymentMethod[] = [
  'cash',
  'card',
  'upi',
  'bank_transfer',
  'cheque',
  'online',
];

interface Props {
  invoice: Invoice;
  studentName: string;
  onClose: () => void;
}

export function PaymentModal({ invoice, studentName, onClose }: Props) {
  const queryClient = useQueryClient();
  const balance = invoice.balance ?? invoice.totalAmount - invoice.amountPaid;
  const [amount, setAmount] = useState(balance);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');

  const mutation = useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      apiPost<PaymentResult>('/fees/payments', input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['fees-invoices'] }),
        queryClient.invalidateQueries({ queryKey: ['fees-reports'] }),
      ]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      invoiceId: invoice._id,
      amount,
      method,
      reference: reference.trim() || undefined,
    });
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Record payment
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {mutation.isSuccess ? (
          <div className="px-6 py-6">
            <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              Payment recorded. Receipt{' '}
              <span className="font-semibold">
                {mutation.data.receipt.receiptNumber}
              </span>{' '}
              issued. Balance remaining:{' '}
              <span className="font-semibold">
                ₹{mutation.data.receipt.balanceAfter}
              </span>
              .
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5">
            <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <div className="font-medium text-slate-800">{studentName}</div>
              <div className="font-mono text-xs">{invoice.invoiceNumber}</div>
              <div className="mt-1">
                Balance due:{' '}
                <span className="font-semibold text-slate-900">
                  ₹{balance}
                </span>
              </div>
            </div>

            {mutation.isError && (
              <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(mutation.error)}
              </div>
            )}

            <label className={label}>
              Amount
              <input
                type="number"
                min={0.01}
                max={balance}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className={field}
              />
            </label>

            <label className={`${label} mt-4`}>
              Method
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className={field}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${label} mt-4`}>
              Reference{' '}
              <span className="font-normal text-slate-400">(optional)</span>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Txn / cheque no."
                className={field}
              />
            </label>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending || amount <= 0 || amount > balance}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {mutation.isPending ? 'Saving…' : 'Record payment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
