import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, errorMessage } from '../../lib/api';
import type { CreateSchoolInput, School } from '../../lib/types';

interface Props {
  onClose: () => void;
}

export function SchoolForm({ onClose }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [city, setCity] = useState('');
  // The school IS its admin — its account is created with the school. No
  // password here: the admin is emailed a set-password invite link.
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [invite, setInvite] = useState<{ url: string; email: string } | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: (input: CreateSchoolInput) =>
      apiPost<School>('/schools', input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] });
      await queryClient.invalidateQueries({ queryKey: ['school-stats'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      // Until email delivery is wired, show the invite link so the super
      // admin can hand it to the school. Otherwise just close.
      if (created.adminInviteUrl) {
        setInvite({ url: created.adminInviteUrl, email: adminEmail.trim() });
      } else {
        onClose();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateSchoolInput = {
      name: name.trim(),
      admin: {
        name: adminName.trim(),
        email: adminEmail.trim(),
      },
    };
    if (code.trim()) input.code = code.trim();
    if (contactEmail.trim()) input.contactEmail = contactEmail.trim();
    if (contactPhone.trim()) input.contactPhone = contactPhone.trim();
    if (city.trim()) input.address = { city: city.trim() };
    if (adminPhone.trim() && input.admin) input.admin.phone = adminPhone.trim();
    mutation.mutate(input);
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  // After creation, if an invite link came back, show it so the super admin
  // can share it (email delivery isn't wired yet).
  if (invite) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
        <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              School created
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
              They'll set a password to activate the account.
            </div>
            <div>
              <div className={label}>Set-password link</div>
              <p className="mt-0.5 text-xs text-slate-500">
                Email delivery isn't configured yet — copy this link and send it
                to the admin.
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
          <h2 className="text-lg font-semibold text-slate-900">New school</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-4 px-6 py-5">
            {mutation.isError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage(mutation.error)}
              </div>
            )}

            <label className={label}>
              School name
              <input
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunshine Preschool"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Code
                <input
                  className={field}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Auto-generated"
                  maxLength={20}
                />
              </label>
              <label className={label}>
                City
                <input
                  className={field}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Contact email
                <input
                  type="email"
                  className={field}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </label>
              <label className={label}>
                Contact phone
                <input
                  className={field}
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </label>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Admin account
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                We'll email this admin a link to set their password and
                activate the account.
              </p>
            </div>

            <label className={label}>
              Admin name
              <input
                className={field}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Admin email
                <input
                  type="email"
                  className={field}
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
              </label>
              <label className={label}>
                Admin phone
                <input
                  className={field}
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                />
              </label>
            </div>
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
              {mutation.isPending ? 'Saving…' : 'Create school'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
