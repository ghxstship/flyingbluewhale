'use client';
import Checkbox from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, formatLabel, statusColor } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import RowActionMenu from '@/components/shared/RowActionMenu';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import { Upload } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  type: string;
  status: string;
  total: number;
  amount_paid: number;
  issue_date: string;
  due_date: string;
}

type Tab = 'all' | 'draft' | 'sent' | 'paid' | 'overdue';

const TAB_KEYS: Tab[] = ['all', 'draft', 'sent', 'paid', 'overdue'];
const TAB_LABELS: Record<Tab, string> = {
  all: 'All',
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
};

export default function InvoiceTabs({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const tabItems = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        key,
        label: TAB_LABELS[key],
        count: invoices.filter((i) => key === 'all' || i.status === key).length,
      })),
    [invoices],
  );

  const filtered = useMemo(() => {
    let result = invoices;
    if (activeTab !== 'all') result = result.filter((inv) => inv.status === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoice_number.toLowerCase().includes(q) ||
          inv.client_name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [invoices, activeTab, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((i) => i.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleBulkVoid(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/invoices/${id}/void`, { method: 'POST' })));
    router.refresh();
  }

  async function handleDeleteInvoice(id: string) {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    router.refresh();
  }

  return (
    <>
      <Tabs tabs={tabItems} activeTab={activeTab} onTabChange={setActiveTab} className="mb-6" />

      {/* Search + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Search invoices..." />
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} />
            Import
          </Button>
          <DataExportMenu data={filtered} entityKey="invoices" filename="invoices-export" entityType="Invoices" />
        </div>
      </div>

      {/* Bulk bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="invoice"
        actions={[
          {
            label: 'Void',
            variant: 'danger',
            confirm: { title: 'Void Invoices', message: `Are you sure you want to void ${count} invoice(s)?` },
            onClick: handleBulkVoid,
          },
        ]}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <Table >
            <TableHeader>
              <TableRow className="border-b border-border bg-bg-secondary">
                <TableHead className="px-4 py-3 text-left w-10">
                  <Checkbox checked={isAllSelected} indeterminate={isSomeSelected} onChange={toggleAll} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                </TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Invoice" field="invoice_number" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Client" field="client_name" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Type" field="type" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Amount" field="total_amount" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Paid" field="amount_paid" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3"><SortableHeader label="Due Date" field="due_date" currentSort={sort} onSort={handleSort} /></TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted w-16"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.map((inv) => (
                <TableRow key={inv.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(inv.id) ? 'bg-blue-50/50' : ''}`}>
                  <TableCell className="px-4 py-3.5">
                    <Checkbox checked={isSelected(inv.id)} onChange={() => toggle(inv.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Link href={`/app/invoices/${inv.id}`} className="text-sm font-medium text-foreground hover:underline">{inv.invoice_number}</Link>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-sm text-text-secondary">{inv.client_name}</TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="muted" className="capitalize">{inv.type}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge variant="muted" className={statusColor(inv.status)}>{formatLabel(inv.status)}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(inv.total)}</TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm tabular-nums text-text-secondary">{formatCurrency(inv.amount_paid)}</TableCell>
                  <TableCell className="px-6 py-4 text-right text-sm text-text-muted">{formatDate(inv.due_date)}</TableCell>
                  <TableCell className="px-6 py-4">
                    <RowActionMenu actions={[
                      { label: 'View', onClick: () => router.push(`/app/invoices/${inv.id}`) },
                      { label: 'Delete', variant: 'danger', onClick: () => setDeleteId(inv.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={9} className="px-6 py-12 text-center text-sm text-text-muted">No invoices match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {deleteId && (
        <ConfirmDialog
          open
          title="Delete Invoice"
          message="Are you sure you want to delete this invoice? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDeleteInvoice(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Invoices"
        entityKey="invoices"
        apiEndpoint="/api/invoices"
        onComplete={() => router.refresh()}
      />
    </>
  );
}
