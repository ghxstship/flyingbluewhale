'use client';

import { useState, useEffect, type FormEvent } from 'react';
import type { DealStage } from '@/types/database';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface ClientOption {
  id: string;
  company_name: string;
}

interface DealFormModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'verbal_yes', label: 'Verbal Yes' },
  { value: 'contract_signed', label: 'Contract Signed' },
];

export default function DealFormModal({ open, onClose, onCreated }: DealFormModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [value, setValue] = useState('');
  const [probability, setProbability] = useState('50');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.clients)) setClients(data.clients);
      })
      .catch(() => {});
  }, [open]);

  function resetForm() {
    setName(''); setClientId(''); setValue('');
    setProbability('50'); setExpectedCloseDate(''); setStage('lead'); setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          client_id: clientId,
          value: parseFloat(value) || 0,
          probability: parseInt(probability, 10) || 50,
          expected_close_date: expectedCloseDate || null,
          stage,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create deal');
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
    <ModalShell open={open} onClose={onClose} title="New Deal">
      {error && <Alert className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Deal Name</FormLabel>
          <FormInput type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nike Air Max Experience" />
        </div>

        <div>
          <FormLabel>Client</FormLabel>
          <FormSelect required value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select a client...</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
          </FormSelect>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Value ($)</FormLabel>
            <FormInput type="number" required min={0} step="0.01" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
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

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>
            {submitting ? 'Creating...' : 'Create Deal'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
