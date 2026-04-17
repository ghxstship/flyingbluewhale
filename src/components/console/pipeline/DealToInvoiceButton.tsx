'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DealToInvoiceButton({ dealId, dealValue, stage }: { dealId: string; dealValue: number; stage: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (stage !== 'contract_signed') return null;

  async function handleConvert() {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/invoice`, { method: 'POST' });
      if (res.ok) {
        const { invoice } = await res.json();
        router.push(`/app/invoices/${invoice.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleConvert} loading={loading}>
      <FileText size={14} className="mr-1.5 text-blue-600" />
      Create Invoice
    </Button>
  );
}
