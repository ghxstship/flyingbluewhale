'use client';
import Checkbox from '@/components/ui/Checkbox';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, statusColor, formatLabel, formatDate } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import FilterPills from '@/components/ui/FilterPills';
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { IconPlus } from '@/components/ui/Icons';
import AIDraftProposalModal from '@/components/console/proposals/AIDraftProposalModal';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import PageHeader from '@/components/shared/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
/** Forward-declared — proposals + clients tables pending migration */
interface Proposal {
  id: string; name: string; subtitle?: string; status: string;
  client_id: string; total_value: number; currency: string;
  probability_percent: number; prepared_date?: string; created_at: string;
  [key: string]: any;
}
interface Client {
  id: string; company_name: string; [key: string]: any;
}

const statusFilters = [
  'all',
  'draft',
  'sent',
  'viewed',
  'negotiating',
  'approved',
  'in_production',
  'active',
  'complete',
  'cancelled',
] as const;

export default function ProposalsTable({
  proposals,
  clients,
}: {
  proposals: Proposal[];
  clients: Client[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    views,
    activeView,
    activeViewId,
    setActiveViewId,
    createView,
    updateView,
    deleteView,
    duplicateView,
  } = useEntityViews({ entityType: 'proposals' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'name', label: 'Proposal Name' },
      { key: 'client', label: 'Client' },
      { key: 'status', label: 'Status' },
      { key: 'prepared_date', label: 'Date' },
      { key: 'total_value', label: 'Value' },
      { key: 'probability', label: 'Probability' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const clientName = useCallback(
    (clientId: string): string =>
      clients.find((c) => c.id === clientId)?.company_name ?? 'Unknown',
    [clients],
  );

  const filtered = useMemo(() => {
    let result = proposals;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          clientName(p.client_id).toLowerCase().includes(q),
      );
    }
    return result;
  }, [proposals, statusFilter, search, clientName]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((p) => p.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  const totalPipelineValue = useMemo(
    () => filtered.reduce((sum, p) => sum + p.total_value, 0),
    [filtered],
  );

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/proposals/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  async function handleDeleteProposal(id: string) {
    const res = await fetch(`/api/proposals/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete');
    setDeleteId(null);
    router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Proposals"
        subtitle={`${filtered.length} proposal${filtered.length !== 1 ? 's' : ''} \u00B7 ${formatCurrency(totalPipelineValue)} total value`}
      >
        <Button variant="secondary" onClick={() => setShowAiDraft(true)}>
          <Sparkles size={16} />
          AI Draft
        </Button>
        <Button href="/app/proposals/new">
          <IconPlus size={20} />
          New Proposal
        </Button>
      </PageHeader>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4">
        {/* Top row: Views & Main Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ViewBar
            views={views}
            activeViewId={activeViewId}
            onSelectView={setActiveViewId}
            onCreateView={(opts) => createView({
              name: opts.name,
              display_type: opts.display_type,
              config: opts.inherit ? activeView?.config : {}
            })}
            onDeleteView={deleteView}
            onDuplicateView={duplicateView}
          />
          <div className="flex items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Search proposals..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <DataExportMenu data={sorted} entityKey="proposals" filename="proposals-export" entityType="Proposals" />
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <FilterPills
            items={statusFilters.map((s) => ({
              key: s,
              label: s === 'all' ? 'All Statuses' : formatLabel(s),
              count: s === 'all' ? proposals.length : proposals.filter((p) => p.status === s).length,
            }))}
            activeKey={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="proposal"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Proposals', message: `Are you sure you want to delete ${count} proposal(s)?` },
            onClick: handleBulkDelete,
          },
        ]}
      />

      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-4 py-3 text-left w-10">
                  <Checkbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </TableHead>
                {isVisible('name') && <TableHead className="px-6 py-3"><SortableHeader label="Proposal Name" field="name" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('client') && <TableHead className="px-6 py-3"><SortableHeader label="Client" field="client_id" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('status') && <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('prepared_date') && <TableHead className="px-6 py-3"><SortableHeader label="Date" field="prepared_date" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('total_value') && <TableHead className="px-6 py-3"><SortableHeader label="Value" field="total_value" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('probability') && <TableHead className="px-6 py-3"><SortableHeader label="Probability" field="probability_percent" currentSort={sort} onSort={handleSort} /></TableHead>}
                <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.map((p) => (
                <TableRow key={p.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(p.id) ? 'bg-blue-50/50' : ''}`}>
                  <TableCell className="px-4 py-3.5">
                    <Checkbox checked={isSelected(p.id)} onChange={() => toggle(p.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </TableCell>
                  {isVisible('name') && (
                    <TableCell className="px-6 py-3.5">
                      <div>
                        <Link href={`/app/proposals/${p.id}`} className="text-sm font-medium text-foreground hover:underline">{p.name}</Link>
                        {p.subtitle && <p className="text-xs text-text-secondary mt-0.5">{p.subtitle}</p>}
                      </div>
                    </TableCell>
                  )}
                  {isVisible('client') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{clientName(p.client_id)}</TableCell>}
                  {isVisible('status') && (
                    <TableCell className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>{formatLabel(p.status)}</span>
                    </TableCell>
                  )}
                  {isVisible('prepared_date') && <TableCell className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{formatDate(p.prepared_date || p.created_at)}</TableCell>}
                  {isVisible('total_value') && <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(p.total_value, p.currency)}</TableCell>}
                  {isVisible('probability') && (
                    <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{p.probability_percent}%</TableCell>
                  )}
                  <TableCell className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => router.push(`/app/proposals/${p.id}`) },
                      { label: 'Delete', variant: 'danger', onClick: () => setDeleteId(p.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={8} className="px-6 py-12 text-center text-sm text-text-muted">No proposals match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />

      {deleteId && (
        <ConfirmDialog
          open
          title="Delete Proposal"
          message="Are you sure you want to delete this proposal? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDeleteProposal(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <AIDraftProposalModal
        open={showAiDraft}
        onClose={() => setShowAiDraft(false)}
        onDraftReady={(draft) => {
          // Store draft data for the new proposal page to consume
          try { sessionStorage.setItem('ai_draft_proposal', JSON.stringify(draft)); } catch { /* quota exceeded — proceed without */ }
          setShowAiDraft(false);
          router.push('/app/proposals/new');
        }}
      />
    </>
  );
}
