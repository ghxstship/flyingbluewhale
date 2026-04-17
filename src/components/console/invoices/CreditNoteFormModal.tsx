'use client';

import { useState, type FormEvent } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormInput from '@/components/ui/FormInput';
import FormTextarea from '@/components/ui/FormTextarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface CreditNoteFormModalProps { open: boolean; onClose: () => void; onCreated: () => void; }

export default function CreditNoteFormModal({ open, onClose, onCreated }: CreditNoteFormModalProps) {
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() { setInvoiceId(''); setAmount(''); setReason(''); setError(null); }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/invoices/credit-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId, amount: parseFloat(amount), reason: reason || undefined }),
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || 'Failed to issue credit note'); }
      resetForm(); onCreated(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'An error occurred'); }
    finally { setSubmitting(false); }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Issue Credit Note" size="md">
      {error && <Alert className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Invoice ID</FormLabel>
          <FormInput type="text" required value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)} placeholder="Invoice UUID or number" />
        </div>
        <div>
          <FormLabel>Credit Amount</FormLabel>
          <FormInput type="number" required min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <FormLabel>Reason</FormLabel>
          <FormTextarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason for credit..." />
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting}>{submitting ? 'Issuing...' : 'Issue Credit Note'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
