'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import FormLabel from '@/components/ui/FormLabel';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import FormInput from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface AIDraftProposalModalProps {
  open: boolean;
  onClose: () => void;
  onDraftReady: (draft: Record<string, unknown>) => void;
}

export default function AIDraftProposalModal({ open, onClose, onDraftReady }: AIDraftProposalModalProps) {
  const [form, setForm] = useState({
    event_type: '',
    estimated_budget: '',
    description: '',
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/draft-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: form.event_type,
          estimated_budget: form.estimated_budget ? parseFloat(form.estimated_budget) : undefined,
          description: form.description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate draft');
      }

      const data = await res.json();
      onDraftReady(data.draft);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="AI Proposal Draft" subtitle="Generate a proposal draft using AI">
      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="space-y-4">
        <div>
          <FormLabel>Event Type</FormLabel>
          <FormSelect value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}>
            <option value="">Select type…</option>
            <option value="corporate_event">Corporate Event</option>
            <option value="brand_activation">Brand Activation</option>
            <option value="festival">Festival</option>
            <option value="conference">Conference</option>
            <option value="product_launch">Product Launch</option>
            <option value="gala">Gala</option>
            <option value="other">Other</option>
          </FormSelect>
        </div>

        <div>
          <FormLabel>Estimated Budget</FormLabel>
          <FormInput type="number" value={form.estimated_budget}
            onChange={(e) => setForm((p) => ({ ...p, estimated_budget: e.target.value }))}
            placeholder="50000" />
        </div>

        <div>
          <FormLabel>Brief Description</FormLabel>
          <FormTextarea value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3} placeholder="Tell us about the event, venue, and goals…" />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleGenerate} loading={generating}>
            {generating ? 'Generating Draft…' : 'Generate Draft'}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
