import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../lib/api';
import type { InviteInfo } from '../lib/types';

/**
 * Public page an invited admin lands on from their email link
 * (`/set-password?token=...`). They set a password, which activates the
 * account; then they're sent to the login page.
 */
export function SetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: () => apiGet<InviteInfo>(`/auth/invite?token=${token}`),
    enabled: token.length > 0,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiPost<void>('/auth/accept-invite', { token, password }),
    onSuccess: () => setDone(true),
  });

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || mismatch) return;
    mutation.mutate();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 text-center text-lg font-semibold tracking-tight text-slate-900">
          AVAA<span className="text-indigo-600">School</span>
        </div>

        {done ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Your password is set and your account is active.
            </div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Go to sign in
            </button>
          </div>
        ) : !token ? (
          <p className="text-center text-sm text-slate-500">
            This link is missing its invitation token.
          </p>
        ) : invite.isLoading ? (
          <p className="text-center text-sm text-slate-400">Checking invite…</p>
        ) : invite.isError ? (
          <div className="space-y-3 text-center">
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage(invite.error)}
            </div>
            <Link
              to="/login"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Set your password
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                for <span className="font-medium">{invite.data?.email}</span>
              </p>
            </div>

            {mutation.isError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(mutation.error)}
              </div>
            )}

            <label className={label}>
              New password
              <input
                type="password"
                className={field}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>

            <label className={label}>
              Confirm password
              <input
                type="password"
                className={field}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>

            {mismatch && (
              <p className="text-xs text-red-600">Passwords don't match.</p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || password.length < 8 || mismatch}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {mutation.isPending ? 'Activating…' : 'Set password & activate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
