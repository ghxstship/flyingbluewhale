'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Alert from '@/components/ui/Alert';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

export default function InvoiceActions({ invoiceId, invoiceNumber, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [showVoid, setShowVoid] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to send invoice');
      }
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  async function handleVoid() {
    const res = await fetch(`/api/invoices/${invoiceId}/void`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to void invoice');
    }
    router.refresh();
    setShowVoid(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          href={`/api/documents/invoice?invoiceId=${invoiceId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download DOCX
        </Button>
        {status === 'draft' && (
          <Button onClick={handleSend}
            disabled={sending}>
            {sending ? 'Sending...' : 'Send Invoice'}
          </Button>
        )}
        {status !== 'void' && status !== 'paid' && (
          <Button
            variant="danger"
            onClick={() => setShowVoid(true)}
          >
            Void
          </Button>
        )}
      </div>

      {sendError && (
        <Alert className="mt-2">{sendError}</Alert>
      )}

      <ConfirmDialog
        open={showVoid}
        title="Void Invoice"
        message={`Are you sure you want to void invoice ${invoiceNumber}? This action marks the invoice as void and cannot be reversed.`}
        confirmLabel="Void Invoice"
        variant="danger"
        onConfirm={handleVoid}
        onCancel={() => setShowVoid(false)}
      />
    </>
  );
}
