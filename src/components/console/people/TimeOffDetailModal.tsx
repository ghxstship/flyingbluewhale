'use client';

import { useState } from 'react';
import ModalShell from '@/components/ui/ModalShell';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import StatusBadge from '@/components/ui/StatusBadge';

interface TimeOffRequest {
  id: string;
  userName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
}

interface TimeOffDetailModalProps {
  open: boolean;
  onClose: () => void;
  request: TimeOffRequest;
  isAdmin: boolean;
  onReviewed: () => void;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TimeOffDetailModal({ open, onClose, request, isAdmin, onReviewed }: TimeOffDetailModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(action: 'approve' | 'deny') {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/time-off/${request.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to ${action} request`);
      }
      onReviewed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/time-off/${request.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to cancel request');
      }
      onReviewed();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Time-Off Request Details">
      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="rounded-xl border border-border bg-background divide-y divide-border mb-4">
        {[
          { label: 'Person', value: request.userName },
          { label: 'Dates', value: `${formatDate(request.startDate)} — ${formatDate(request.endDate)}` },
          { label: 'Days', value: String(request.days) },
          { label: 'Reason', value: request.reason ?? '—' },
          { label: 'Status', value: request.status.charAt(0).toUpperCase() + request.status.slice(1), isBadge: true },
        ].map((field) => (
          <div key={field.label} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-text-secondary">{field.label}</span>
            {field.isBadge ? (
              <StatusBadge status={request.status} />
            ) : (
              <span className="text-sm font-medium text-foreground">{field.value}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {request.status === 'pending' && !isAdmin && (
          <Button variant="secondary" onClick={handleCancel} loading={submitting}>
            Withdraw Request
          </Button>
        )}
        {request.status === 'pending' && isAdmin && (
          <>
            <Button variant="secondary" onClick={() => handleReview('deny')} loading={submitting}>
              Deny
            </Button>
            <Button onClick={() => handleReview('approve')} loading={submitting}>
              Approve
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </ModalShell>
  );
}
