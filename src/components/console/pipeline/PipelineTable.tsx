'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSort } from '@/hooks/useSort';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import { formatLabel, formatCurrency } from '@/lib/utils';
import StatusBadge, { PIPELINE_STAGE_COLORS } from '@/components/ui/StatusBadge';
import SearchInput from '@/components/ui/SearchInput';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface Deal {
  id: string;
  title: string;
  client_name: string | null;
  value: number;
  stage: string;
  probability: number;
  expected_close: string | null;
  owner_name: string | null;
}





export default function PipelineTable({ deals }: { deals: Deal[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.client_name?.toLowerCase().includes(q) ||
        d.owner_name?.toLowerCase().includes(q),
    );
  }, [deals, search]);

  const { sorted, sort, handleSort } = useSort(filtered);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search deals..." />
      </div>

      <div className="rounded-xl border border-border bg-background overflow-hidden overflow-x-auto">
        <Table >
          <TableHeader>
            <TableRow className="border-b border-border bg-bg-secondary">
              <TableHead className="px-6 py-3"><SortableHeader label="Deal" field="title" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Client" field="client_name" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Value" field="value" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Stage" field="stage" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Probability" field="probability" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Expected Close" field="expected_close" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3"><SortableHeader label="Owner" field="owner_name" currentSort={sort} onSort={handleSort} /></TableHead>
              <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {sorted.map((deal) => (
              <TableRow key={deal.id} className="transition-colors hover:bg-bg-secondary/50">
                <TableCell className="px-6 py-3.5">
                  <Link href={`/app/pipeline/${deal.id}`} className="text-sm font-medium text-foreground hover:underline">{deal.title}</Link>
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{deal.client_name ?? '\u2014'}</TableCell>
                <TableCell className="px-6 py-3.5 text-sm font-medium tabular-nums text-foreground">{formatCurrency(deal.value)}</TableCell>
                <TableCell className="px-6 py-3.5">
                  <StatusBadge status={deal.stage} colorMap={PIPELINE_STAGE_COLORS} />
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm tabular-nums text-text-secondary">{deal.probability}%</TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">
                  {deal.expected_close ? new Date(deal.expected_close).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '\u2014'}
                </TableCell>
                <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{deal.owner_name ?? '\u2014'}</TableCell>
                <TableCell className="px-6 py-3.5">
                  <RowActionMenu actions={[
                    { label: 'View', onClick: () => router.push(`/app/pipeline/${deal.id}`) },
                    { label: 'Edit', onClick: () => router.push(`/app/pipeline/${deal.id}?edit=true`) },
                    { label: 'Delete', variant: 'danger', onClick: () => setDeleteId(deal.id) },
                  ]} />
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow><TableCell colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No deals match your search.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {deleteId && (
        <ConfirmDialog
          open
          title="Delete Deal"
          message="Are you sure you want to delete this deal? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => {
            await fetch(`/api/deals/${deleteId}`, { method: 'DELETE' });
            setDeleteId(null);
            router.refresh();
          }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}
