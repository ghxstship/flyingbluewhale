'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { DealStage } from '@/types/database';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import Tooltip from '@/components/ui/Tooltip';
import Button from '@/components/ui/Button';

interface DealCardProps {
  id: string;
  title: string;
  clientName: string;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  stage: DealStage;
  /** ISO timestamp of last update — used for deal rotting indicator. */
  updatedAt?: string | null;
  /** Owner display name (initials shown on card). */
  ownerName?: string | null;
}

function getDaysSinceUpdate(updatedAt: string | null | undefined): number {
  if (!updatedAt) return 0;
  const ms = Date.now() - new Date(updatedAt).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function getOwnerInitials(name: string | null | undefined): string {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function DealCard({
  id,
  title,
  clientName,
  value,
  probability,
  expectedCloseDate,
  stage,
  updatedAt,
  ownerName,
}: DealCardProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);

  const daysSinceUpdate = useMemo(() => getDaysSinceUpdate(updatedAt), [updatedAt]);

  // Only show rotting for active deals (not won or lost)
  const isActive = stage !== 'contract_signed' && stage !== 'lost';
  const isRotting = isActive && daysSinceUpdate >= 7;
  const isCritical = isActive && daysSinceUpdate >= 14;

  const rottingBorder = isCritical
    ? 'border-red-300 ring-1 ring-red-100'
    : isRotting
      ? 'border-amber-300 ring-1 ring-amber-100'
      : 'border-border';

  const rottingLabel = isCritical
    ? `Stale ${daysSinceUpdate}d — needs attention`
    : isRotting
      ? `Inactive for ${daysSinceUpdate} days`
      : '';

  const ownerInitials = getOwnerInitials(ownerName);

  async function handleDelete() {
    const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete deal');
    router.refresh();
  }

  const card = (
    <div className={`group relative rounded-lg border bg-background p-3 shadow-sm transition-colors hover:border-foreground/20 ${rottingBorder}`}>
      <Link href={`/app/pipeline/${id}`} className="block">
        <div className="flex items-start justify-between gap-1">
          <p className="text-sm font-medium text-foreground truncate pr-6">{title}</p>
          {ownerInitials && (
            <span className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full bg-bg-secondary text-[9px] font-semibold text-text-muted" title={ownerName ?? ''}>
              {ownerInitials}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-text-muted truncate">{clientName}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {formatCurrency(value)}
          </span>
          <span className="text-xs tabular-nums text-text-muted">{probability}%</span>
        </div>
        {expectedCloseDate && (
          <p className="mt-1.5 text-xs text-text-muted">
            Close:{' '}
            {new Date(expectedCloseDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
        {isRotting && (
          <div className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
            <AlertCircle size={10} />
            {daysSinceUpdate}d inactive
          </div>
        )}
      </Link>
      <Button
        onClick={(e) => { e.stopPropagation(); setShowDelete(true); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded p-1 text-text-muted hover:text-red-600 hover:bg-red-500/10"
        title="Delete deal"
      >
        <Trash2 size={12} />
      </Button>
    </div>
  );

  return (
    <>
      {rottingLabel ? (
        <Tooltip label={rottingLabel}>
          {card}
        </Tooltip>
      ) : card}

      <ConfirmDialog
        open={showDelete}
        title="Delete Deal"
        message={`Are you sure you want to delete "${title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}

