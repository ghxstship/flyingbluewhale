'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { formatCurrencyDetailed } from '@/lib/utils';
import FormSelect from '@/components/ui/FormSelect';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';

interface PaymentRecorderProps {
  invoiceId: string;
  balanceDue: number;
}

export default function PaymentRecorder({
  invoiceId,
  balanceDue,
}: PaymentRecorderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(balanceDue.toString());
  const [method, setMethod] = useState('wire');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          method,
          reference: reference || undefined,
          received_date: date,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to record payment.');
        setSubmitting(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-sm font-semibold text-foreground mb-3">Record Payment</h2>
      <p className="text-xs text-text-muted mb-4">
        Balance due: <span className="font-semibold text-red-700">{formatCurrencyDetailed(balanceDue)}</span>
      </p>

      {!open ? (
        <Button
          onClick={() => setOpen(true)}
          className="w-full"
        >
          Record Payment
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <FormLabel>Amount</FormLabel>
            <FormInput
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              value={amount}
              onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <FormLabel>Method</FormLabel>
            <FormSelect
              value={method}
              onChange={(e) => setMethod(e.target.value)}>
              <option value="wire">Wire Transfer</option>
              <option value="check">Check</option>
              <option value="credit_card">Credit Card</option>
              <option value="ach">ACH</option>
              <option value="cash">Cash</option>
            </FormSelect>
          </div>
          <div>
            <FormLabel>Date</FormLabel>
            <FormInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <FormLabel>Reference (optional)</FormLabel>
            <FormInput
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check #, transaction ID..." />
          </div>
          {error && (
            <Alert className="mb-4">{error}</Alert>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              type="button"
              disabled={submitting}
              onClick={() => { setOpen(false); setError(null); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button className="flex-1" type="submit"
              disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
