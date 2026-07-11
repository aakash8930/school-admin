import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, errorMessage } from '../lib/api';
import { Drawer } from '../components/Drawer';
import type {
  CreateUserInput,
  PaginatedResult,
  School,
  User,
} from '../lib/types';

/**
 * The super admin only creates school admin accounts. Teachers and parents
 * are onboarded by each school itself (parents are auto-created when a
 * student is enrolled and sign in by phone OTP).
 */
interface Props {
  onClose: () => void;
}

export function UserForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [invite, setInvite] = useState<{ url: string; email: string } | null>(
    null,
  );

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
      role: 'admin',
      email: email.trim(),
      schoolId,
    };
    if (phone.trim()) input.phone = `+91${phone.trim()}`;
    mutation.mutate(input);
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  if (invite) {
    return (
      <Drawer title="Admin invited" onClose={onClose}>
        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Invite sent to <span className="font-medium">{invite.email}</span>.
          </div>
          <div>
            <div className={label}>Set-password link</div>
            <p className="mt-0.5 text-xs text-slate-500">
              The link was emailed to the user — shown here too in case you
              want to share it another way.
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
      </Drawer>
    );
  }

  return (
    <Drawer
      title="New school admin"
      subtitle="A set-password invite is emailed. Teachers and parents are added by their school."
      onClose={onClose}
    >
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
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
              Mobile number (optional)
              <div className="mt-1 flex">
                <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                  +91
                </span>
                <input
                  className="w-full rounded-r-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder="98765 43210"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit Indian mobile number"
                />
              </div>
            </label>

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
              {mutation.isPending ? 'Saving…' : 'Create admin'}
            </button>
          </div>
        </form>
    </Drawer>
  );
}
