'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface RecurringScheduleFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }
const FREQUENCIES = ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'] as const;

export default function RecurringScheduleFormModal({ open, onClose, onCreated }: RecurringScheduleFormModalProps) {
  const [clientId, setClientId] = useState('');
  const [frequency, setFrequency] = useState('');
  const [nextIssueDate, setNextIssueDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setClientId(''); setFrequency(''); setNextIssueDate(''); setEndDate(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, frequency, next_issue_date: nextIssueDate, end_date: endDate || undefined }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to create schedule'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="New Recurring Schedule" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Client ID</FormLabel>
          <FormInput type="text" required value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Client UUID" />
        </div>
        <div>
          <FormLabel>Frequency</FormLabel>
          <FormSelect required value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="">Select frequency...</option>
            {FREQUENCIES.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
          </FormSelect>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Next Issue Date</FormLabel>
            <FormInput type="date" required value={nextIssueDate} onChange={(e) => setNextIssueDate(e.target.value)} />
          </div>
          <div>
            <FormLabel>End Date</FormLabel>
            <FormInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Creating...' : 'Create Schedule'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
