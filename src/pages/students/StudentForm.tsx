import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost, errorMessage } from '../../lib/api';
import type {
  CreateStudentInput,
  Gender,
  GuardianRelationship,
  Student,
} from '../../lib/types';

const GENDERS: Gender[] = ['male', 'female', 'other'];
const RELATIONSHIPS: GuardianRelationship[] = [
  'father',
  'mother',
  'guardian',
  'grandparent',
  'sibling',
  'other',
];

interface Props {
  onClose: () => void;
}

export function StudentForm({ onClose }: Props) {
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelationship, setGuardianRelationship] =
    useState<GuardianRelationship>('mother');
  const [guardianPhone, setGuardianPhone] = useState('');

  const mutation = useMutation({
    mutationFn: (input: CreateStudentInput) =>
      apiPost<Student>('/students', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] });
      await queryClient.invalidateQueries({ queryKey: ['student-stats'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input: CreateStudentInput = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      gender,
    };
    if (admissionNumber.trim()) input.admissionNumber = admissionNumber.trim();
    if (guardianName.trim() && guardianPhone.trim()) {
      input.guardians = [
        {
          name: guardianName.trim(),
          relationship: guardianRelationship,
          phone: guardianPhone.trim(),
          isPrimary: true,
        },
      ];
    }
    mutation.mutate(input);
  };

  const field =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const label = 'block text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">New student</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

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

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                First name
                <input
                  className={field}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label className={label}>
                Last name
                <input
                  className={field}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                Date of birth
                <input
                  type="date"
                  className={field}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </label>
              <label className={label}>
                Gender
                <select
                  className={field}
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={label}>
              Admission number{' '}
              <span className="font-normal text-slate-400">
                (optional — auto-generated)
              </span>
              <input
                className={field}
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="ADM-2026-00001"
              />
            </label>

            <fieldset className="rounded-lg border border-slate-200 p-4">
              <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Primary guardian
              </legend>
              <label className={label}>
                Name
                <input
                  className={field}
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className={label}>
                  Relationship
                  <select
                    className={field}
                    value={guardianRelationship}
                    onChange={(e) =>
                      setGuardianRelationship(
                        e.target.value as GuardianRelationship,
                      )
                    }
                  >
                    {RELATIONSHIPS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={label}>
                  Phone
                  <input
                    className={field}
                    value={guardianPhone}
                    onChange={(e) => setGuardianPhone(e.target.value)}
                    placeholder="+1 555-0100"
                  />
                </label>
              </div>
            </fieldset>
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
              {mutation.isPending ? 'Saving…' : 'Create student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
