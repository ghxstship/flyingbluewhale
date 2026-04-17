'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function CredentialAssetLinker({ projectId, credentialId, onLinked }: { projectId: string, credentialId: string, onLinked?: () => void }) {
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/entity-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          source_type: 'credential_order',
          source_id: credentialId,
          item_id: itemId,
          quantity,
          link_type: 'assigned'
        })
      });
      if (!res.ok) throw new Error('Failed to link asset');
      setItemId('');
      setQuantity(1);
      if (onLinked) onLinked();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 mt-4 border border-border-subtle bg-surface-raised">
      <h4 className="text-sm font-heading mb-3">Provision Additional Asset</h4>
      <div className="flex gap-2 items-center">
        <input 
          type="text" 
          placeholder="Catalog Item ID or Asset Tag" 
          value={itemId} 
          onChange={e => setItemId(e.target.value)} 
          className="input flex-1 text-sm bg-surface"
        />
        <input 
          type="number" 
          min="1" 
          className="input w-16 text-sm text-center bg-surface" 
          value={quantity} 
          onChange={e => setQuantity(parseInt(e.target.value) || 1)}
        />
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleLink} 
          disabled={!itemId || loading}
        >
          {loading ? 'Adding...' : 'Add Link'}
        </Button>
      </div>
    </div>
  );
}
