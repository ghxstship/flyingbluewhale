'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'controller', label: 'Controller' },
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'client', label: 'Client' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'crew', label: 'Crew' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'community', label: 'Community' },
] as const;

export default function InviteMemberModal({ open, onClose, onCreated }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('collaborator');
  const [personalMessage, setPersonalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setEmail(''); setRole('collaborator'); setPersonalMessage(''); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
          personal_message: personalMessage || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send invitation');
      }

      resetForm();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Invite Team Member">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Email Address</FormLabel>
          <FormInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" />
        </div>

        <div>
          <FormLabel>Role</FormLabel>
          <FormSelect required value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </FormSelect>
        </div>

        <div>
          <FormLabel>Personal Message (optional)</FormLabel>
          <FormTextarea value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} rows={3}
            placeholder="Hey! I'm inviting you to join our team on FlyteDeck..." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
