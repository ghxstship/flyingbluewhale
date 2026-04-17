'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { AlertBanner } from '@/components/modules/AlertBanner';

export function CheckInScanner({ fallbackSlug }: { fallbackSlug: string }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim()) return;

      setLoading(true);
      setMessage(null);
      try {
        // Attempt to process QR code payload. For simplicity, assume the query is the credential ID or payload containing `{ id: "..." }`.
        let orderId = query;
        if (query.startsWith('{')) {
          const parsed = JSON.parse(query);
          orderId = parsed.id || parsed.order_id;
        }

        const res = await fetch(`/api/v1/credentials/orders/${orderId}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'picked_up', notes: 'Checked in via scanner' })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || data.error || 'Failed to process check-in');

        setMessage({ type: 'success', text: `Success: Credential checked in! Assigned assets marked picked up.` });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
        setQuery('');
      }
    }
  };

  return (
    <div className="w-full max-w-md mb-10">
      {message && (
        <div className="mb-4">
           {message.type === 'error' ? (
             <AlertBanner variant="error" title="Scan Failed">{message.text}</AlertBanner>
           ) : (
             <AlertBanner variant="success" title="Checked In">{message.text}</AlertBanner>
           )}
        </div>
      )}
      
      <div className="relative">
        <Input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleScan}
          disabled={loading}
          placeholder={loading ? 'Processing...' : "Scan QR / barcode or type UUID..."} 
          autoFocus 
          className="w-full text-base py-4 px-4 h-auto shadow-sm" 
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <div className="w-4 h-4 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin" />
          </div>
        )}
      </div>
      <p className="text-center text-[0.5625rem] text-text-disabled mt-2">
        Focus here and scan — results appear automatically
      </p>
    </div>
  );
}
