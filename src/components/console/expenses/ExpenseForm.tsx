'use client';

import { Check } from 'lucide-react';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import ReceiptUploader from './ReceiptUploader';

const CATEGORIES = ['travel', 'meals', 'supplies', 'equipment', 'software', 'other'] as const;

export default function ExpenseForm() {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [proposalId, setProposalId] = useState('');
  const [isBillable, setIsBillable] = useState(false);
  const [proposals, setProposals] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch('/api/proposals?status=active')
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals ?? []))
      .catch(() => {});
  }, []);

  const [receipts, setReceipts] = useState<Array<{ url: string; name: string }>>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          description: description || null,
          expense_date: date,
          proposal_id: proposalId || null,
          is_billable: isBillable,
          receipts,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create expense.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-background px-8 py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
          <Check size={24} className="text-green-600" />
        </div>
        <p className="text-sm font-medium text-green-600">Expense submitted successfully.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setSubmitted(false);
              setCategory('');
              setAmount('');
              setDescription('');
              setReceipts([]);
              setDate(new Date().toISOString().split('T')[0]);
            }}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Submit another
          </button>
          <button
            onClick={() => router.push('/app/expenses')}
            className="text-sm font-medium text-text-secondary hover:underline"
          >
            View all expenses
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-border bg-background px-6 py-6 space-y-5">
        <div>
          <FormLabel>
            Category
          </FormLabel>
          <FormSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </FormSelect>
        </div>

        <div>
          <FormLabel>
            Amount
          </FormLabel>
          <FormInput
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00" />
        </div>

        <div>
          <FormLabel>
            Date
          </FormLabel>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required />
        </div>

        <div>
          <FormLabel>
            Description
          </FormLabel>
          <FormTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the expense..."
          />
        </div>

        <div>
          <FormLabel>Project (Optional)</FormLabel>
          <FormSelect
            value={proposalId}
            onChange={(e) => setProposalId(e.target.value)}
          >
            <option value="">No project</option>
            {proposals.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </FormSelect>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_billable"
            type="checkbox"
            checked={isBillable}
            onChange={(e) => setIsBillable(e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-primary focus:ring-brand-primary"
          />
          <FormLabel htmlFor="is_billable" className="mb-0 cursor-pointer">
            Billable to client
          </FormLabel>
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <FormLabel>Receipts (Optional)</FormLabel>
          <ReceiptUploader 
            onUploadComplete={(url, name) => setReceipts(prev => [...prev, { url, name }])} 
          />
        </div>
      </div>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/app/expenses')}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Cancel
        </button>
        <Button type="submit"
          disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Expense'}
        </Button>
      </div>
    </form>
  );
}
