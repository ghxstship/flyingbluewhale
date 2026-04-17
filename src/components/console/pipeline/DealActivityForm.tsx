'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import FormInput from '@/components/ui/FormInput';
import FormSelect from '@/components/ui/FormSelect';
import { useRouter } from 'next/navigation';

export default function DealActivityForm({ dealId }: { dealId: string }) {
  const [type, setType] = useState('note');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description }),
      });
      if (res.ok) {
        setDescription('');
        setType('note');
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-bg-secondary p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Add Activity</h3>
      <div className="flex gap-3 items-start">
        <div className="w-32 shrink-0">
          <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </FormSelect>
        </div>
        <div className="flex-1">
          <FormInput
            type="text"
            placeholder="What happened?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button type="submit" loading={submitting} disabled={!description.trim()}>
          Post
        </Button>
      </div>
    </form>
  );
}
