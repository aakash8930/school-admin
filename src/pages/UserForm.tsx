import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../lib/api';
import type {
  CreateUserInput,
  PaginatedResult,
  School,
  User,
  UserRole,
} from '../lib/types';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin (school account)' },
  { value: 'principal', label: 'Principal' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'transport_manager', label: 'Transport manager' },
  { value: 'parent', label: 'Parent' },
  { value: 'staff', label: 'Staff' },
  { value: 'super_admin', label: 'Super admin' },
];

interface Props {
  onClose: () => void;
}

export function UserForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [schoolId, setSchoolId] = useState('');
  const [invite, setInvite] = useState<{ url: string; email: string } | null>(
    null,
  );

  // Every role except super_admin belongs to a school.
  const needsSchool = role !== 'super_admin';

  const { data: schools } = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => apiGet<PaginatedResult<School>>('/schools?limit=100'),
  });

  const mutation = useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiPost<{ user: User; inviteUrl?: string }>('/users', input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      if (result.inviteUrl) {
        setInvite({ url: result.inviteUrl, email: email.trim() });
      } else {
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateUserInput = {
      name: name.trim(),
      email: email.trim(),
      role,
    };
    if (phone.trim()) input.phone = phone.trim();
    if (needsSchool) input.schoolId = schoolId;
    mutation.mutate(input);
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  if (invite) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
        <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              User invited
            </h2>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Invite sent to <span className="font-medium">{invite.email}</span>.
            </div>
            <div>
              <div className={label}>Set-password link</div>
              <p className="mt-0.5 text-xs text-slate-500">
                Email delivery isn't configured yet — copy this link and send it
                to the user.
              </p>
              <textarea
                readOnly
                value={invite.url}
                onFocus={(e) => e.currentTarget.select()}
                className={`${field} h-24 font-mono text-xs`}
              />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(invite.url)}
                className="mt-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Copy link
              </button>
            </div>
          </div>
          <div className="mt-auto flex justify-end border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New user</h2>
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
              Name
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className={label}>
              Email
              <input
                type="email"
                className={field}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className={label}>
              Phone
              <input
                className={field}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className={label}>
              Role
              <select
                className={field}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {needsSchool && (
              <label className={label}>
                School
                <select
                  className={field}
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a school…
                  </option>
                  {schools?.data.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </label>
            )}
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
              {mutation.isPending ? 'Saving…' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
