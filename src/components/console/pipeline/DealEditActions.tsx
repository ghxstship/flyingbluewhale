'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import Button from '@/components/ui/Button';
import DealEditModal from '@/components/console/pipeline/DealEditModal';
import { useRouter } from 'next/navigation';
import type { DealStage } from '@/types/database';

interface DealContext {
  id: string;
  title: string;
  deal_value: number;
  stage: DealStage;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
  owner_name: string | null;
}

export default function DealEditActions({ deal }: { deal: DealContext }) {
  const [editOpen, setEditOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
        <Settings size={14} className="mr-1.5" />
        Edit Deal
      </Button>

      {editOpen && (
        <DealEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            router.refresh();
          }}
          deal={deal}
        />
      )}
    </>
  );
}
