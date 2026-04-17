'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

export default function ExpenseApprovalActions({ expenseId, isMileage = false }: { expenseId: string, isMileage?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: 'approve' | 'reject') {
    setLoading(true);
    try {
      const endpoint = isMileage ? `/api/mileage/${expenseId}/${action}` : `/api/expenses/${expenseId}/${action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'reject' ? { reason: 'Rejected by admin' } : {}),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        disabled={loading}
        onClick={() => handleAction('approve')}
        className="text-green-600 hover:text-green-700 text-xs"
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={loading}
        onClick={() => handleAction('reject')}
        className="text-red-600 hover:text-red-700 text-xs"
      >
        Reject
      </Button>
    </div>
  );
}
