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

export default function MileageForm() {
  const router = useRouter();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/mileage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          distance_miles: parseFloat(distance),
          notes: notes || null,
          trip_date: date,
          proposal_id: proposalId || null,
          is_billable: isBillable,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to create mileage entry.');
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
        <p className="text-sm font-medium text-green-600">Mileage logged successfully.</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="ghost"
            onClick={() => {
              setSubmitted(false);
              setOrigin('');
              setDestination('');
              setDistance('');
              setNotes('');
              setDate(new Date().toISOString().split('T')[0]);
            }}
            className="text-sm font-medium text-foreground hover:underline"
          >
            Log another trip
          </Button>
          <Button variant="ghost"
            onClick={() => router.push('/app/expenses/mileage')}
            className="text-sm font-medium text-text-secondary hover:underline"
          >
            View all mileage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-border bg-background px-6 py-6 space-y-5">
        <div>
          <FormLabel>
            From (Origin)
          </FormLabel>
          <FormInput
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
            placeholder="e.g. Office, 123 Main St" />
        </div>

        <div>
          <FormLabel>
            To (Destination)
          </FormLabel>
          <FormInput
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            placeholder="e.g. Client Site, 456 Elm St" />
        </div>

        <div>
          <FormLabel>
            Total Miles
          </FormLabel>
          <FormInput
            type="number"
            min="0.1"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            required
            placeholder="0.0" />
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
            Notes / Purpose
          </FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Describe the purpose of this trip..."
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
      </div>

      {error && (
        <Alert className="mb-4">{error}</Alert>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="ghost"
          type="button"
          onClick={() => router.push('/app/expenses/mileage')}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-bg-secondary"
        >
          Cancel
        </Button>
        <Button type="submit"
          disabled={saving}>
          {saving ? 'Saving...' : 'Log Mileage'}
        </Button>
      </div>
    </form>
  );
}
