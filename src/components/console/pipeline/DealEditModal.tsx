'use client';

/**
 * DealEditModal — Inline deal editing for pipeline deal detail page.
 * Calls PATCH /api/deals/{id} with updated fields.
 *
 * @module components/admin/pipeline/DealEditModal
 */

import { useState, type FormEvent } from 'react';
import type { DealStage } from '@/types/database';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import FormTextarea from '@/components/ui/FormTextarea';

interface DealEditModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  deal: {
    id: string;
    title: string;
    deal_value: number;
    stage: DealStage;
    probability: number;
    expected_close_date: string | null;
    notes: string | null;
    owner_name: string | null;
  };
}

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'verbal_yes', label: 'Verbal Yes' },
  { value: 'contract_signed', label: 'Contract Signed' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
];

export default function DealEditModal({ open, onClose, onSaved, deal }: DealEditModalProps) {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(String(deal.deal_value));
  const [probability, setProbability] = useState(String(deal.probability));
  const [expectedCloseDate, setExpectedCloseDate] = useState(deal.expected_close_date ?? '');
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [notes, setNotes] = useState(deal.notes ?? '');
  const [lostReason, setLostReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        title,
        value: parseFloat(value) || 0,
        probability: parseInt(probability, 10) || 0,
        expected_close_date: expectedCloseDate || null,
        stage,
        notes: notes || null,
      };
      if (stage === 'lost' && lostReason) {
        body.lost_reason = lostReason;
      }

      const res = await fetch(`/api/deals/${deal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update deal');
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Edit Deal">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Deal Name</FormLabel>
          <FormInput type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Value ($)</FormLabel>
            <FormInput type="number" required min={0} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div>
            <FormLabel>Probability (%)</FormLabel>
            <FormInput type="number" min={0} max={100} value={probability} onChange={(e) => setProbability(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Stage</FormLabel>
            <FormSelect value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>
              {STAGE_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </FormSelect>
          </div>
          <div>
            <FormLabel>Expected Close</FormLabel>
            <FormInput type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
          </div>
        </div>

        {stage === 'lost' && (
          <div>
            <FormLabel>Lost Reason</FormLabel>
            <FormInput type="text" value={lostReason} onChange={(e) => setLostReason(e.target.value)} placeholder="Why was this deal lost?" />
          </div>
        )}

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-foreground/20"
            placeholder="Internal notes about this deal..."
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
