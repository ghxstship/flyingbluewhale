'use client';

import { useState, useEffect, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface TimeOffRequestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface Policy {
  id: string;
  name: string;
  type: string;
}

export default function TimeOffRequestModal({ open, onClose, onCreated }: TimeOffRequestModalProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyId, setPolicyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [daysRequested, setDaysRequested] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/time-off/policies')
      .then((r) => r.json())
      .then((d) => {
        const items = d.policies ?? [];
        setPolicies(items);
        if (items.length > 0 && !policyId) {
          setPolicyId(items[0].id);
        }
      })
      .catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetForm() {
    setStartDate('');
    setEndDate('');
    setDaysRequested('');
    setReason('');
    setError(null);
  }

  // Auto-calculate days when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end >= start) {
        let count = 0;
        const current = new Date(start);
        while (current <= end) {
          const day = current.getDay();
          if (day !== 0 && day !== 6) count++;
          current.setDate(current.getDate() + 1);
        }
        setDaysRequested(String(count));
      }
    }
  }, [startDate, endDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/time-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_id: policyId,
          start_date: startDate,
          end_date: endDate,
          days_requested: parseFloat(daysRequested),
          reason: reason || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create request');
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
    <ModalShell open={open} onClose={onClose} title="Request Time Off">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Policy *</FormLabel>
          {policies.length === 0 ? (
            <p className="text-xs text-text-muted mt-1">No time-off policies configured. Please contact your administrator.</p>
          ) : (
            <FormSelect value={policyId} onChange={(e) => setPolicyId(e.target.value)} required>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
              ))}
            </FormSelect>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Start Date *</FormLabel>
            <FormInput type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <FormLabel>End Date *</FormLabel>
            <FormInput type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} />
          </div>
        </div>

        <div>
          <FormLabel>Business Days *</FormLabel>
          <FormInput
            type="number"
            required
            min="0.5"
            step="0.5"
            value={daysRequested}
            onChange={(e) => setDaysRequested(e.target.value)}
            placeholder="Auto-calculated from dates"
          />
        </div>

        <div>
          <FormLabel>Reason (optional)</FormLabel>
          <FormTextarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Vacation, medical appointment, etc." />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} disabled={policies.length === 0}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
