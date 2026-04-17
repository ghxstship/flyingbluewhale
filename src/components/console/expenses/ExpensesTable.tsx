'use client';
import Checkbox from '@/components/ui/Checkbox';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatLabel, statusColor } from '@/lib/utils';
import { useSelection } from '@/hooks/useSelection';
import { useSort } from '@/hooks/useSort';
import BulkActionBar from '@/components/shared/BulkActionBar';
import DataExportMenu from '@/components/shared/DataExportMenu';
import DataImportDialog from '@/components/shared/DataImportDialog';
import SortableHeader from '@/components/shared/SortableHeader';
import RowActionMenu from '@/components/shared/RowActionMenu';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import FilterPills from '@/components/ui/FilterPills';
import { Upload, SlidersHorizontal } from 'lucide-react';
import { useEntityViews } from '@/hooks/useEntityViews';
import { useStoredColumnConfig } from '@/hooks/useStoredColumnConfig';
import ViewBar from '@/components/shared/ViewBar';
import ColumnConfigPanel from '@/components/shared/ColumnConfigPanel';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface ExpenseRow {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: string;
  status: string;
}

const statusFilters = ['all', 'pending', 'approved', 'rejected'] as const;

export default function ExpensesTable({ expenses }: { expenses: ExpenseRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showImport, setShowImport] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [reimburseId, setReimburseId] = useState<string | null>(null);
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
  } = useEntityViews({ entityType: 'expenses' });

  const {
    columns,
    isVisible,
    rowHeight,
    setColumns,
    setRowHeight,
  } = useStoredColumnConfig({
    baseColumns: [
      { key: 'expense_date', label: 'Date' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ],
    activeView,
    onUpdateView: updateView,
  });

  const filtered = useMemo(() => {
    let result = expenses;
    if (statusFilter !== 'all') result = result.filter((e) => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.category.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [expenses, statusFilter, search]);

  const { sorted, sort, handleSort } = useSort(filtered);
  const allIds = useMemo(() => sorted.map((e) => e.id), [sorted]);
  const { selectedIds, isSelected, toggle, toggleAll, isAllSelected, isSomeSelected, deselectAll, count } = useSelection(allIds);

  async function handleBulkDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/expenses/${id}`, { method: 'DELETE' })));
    router.refresh();
  }

  async function handleReimburse(id: string) {
    await fetch(`/api/expenses/${id}/reimburse`, { method: 'POST' });
    setReimburseId(null);
    router.refresh();
  }

  async function handleDeleteExpense(id: string) {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    router.refresh();
  }

  return (
    <>
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
            <SearchInput value={search} onChange={setSearch} placeholder="Search expenses..." />
            <Button variant="ghost" size="sm" onClick={() => setShowColumnConfig(true)} title="Column Settings">
              <SlidersHorizontal size={14} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} />
              Import
            </Button>
            <DataExportMenu data={sorted} entityKey="expenses" filename="expenses-export" entityType="Expenses" />
          </div>
        </div>

        {/* Second row: Filters */}
        <div className="flex items-center justify-between bg-bg-secondary/30 rounded-lg p-2 border border-border">
          <FilterPills
            items={statusFilters.map((s) => ({
              key: s,
              label: s === 'all' ? 'All Status' : formatLabel(s),
              count: s === 'all' ? expenses.length : expenses.filter((e) => e.status === s).length,
            }))}
            activeKey={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onDeselectAll={deselectAll}
        entityLabel="expense"
        actions={[
          {
            label: 'Delete',
            variant: 'danger',
            confirm: { title: 'Delete Expenses', message: `Are you sure you want to delete ${count} expense(s)?` },
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
                {isVisible('expense_date') && <TableHead className="px-6 py-3"><SortableHeader label="Date" field="expense_date" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('category') && <TableHead className="px-6 py-3"><SortableHeader label="Category" field="category" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('description') && <TableHead className="px-6 py-3"><SortableHeader label="Description" field="description" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('amount') && <TableHead className="px-6 py-3"><SortableHeader label="Amount" field="amount" currentSort={sort} onSort={handleSort} /></TableHead>}
                {isVisible('status') && <TableHead className="px-6 py-3"><SortableHeader label="Status" field="status" currentSort={sort} onSort={handleSort} /></TableHead>}
                <TableHead className="px-6 py-3 w-12"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody >
              {sorted.map((exp) => (
                <TableRow key={exp.id} className={`transition-colors hover:bg-bg-secondary/50 ${isSelected(exp.id) ? 'bg-blue-50/50' : ''}`}>
                  <TableCell className="px-4 py-3.5">
                    <Checkbox checked={isSelected(exp.id)} onChange={() => toggle(exp.id)} className="h-3.5 w-3.5 rounded border-border text-foreground focus:ring-foreground/10" />
                  </TableCell>
                  {isVisible('expense_date') && <TableCell className="px-6 py-3.5 text-sm text-foreground whitespace-nowrap">{new Date(exp.expense_date).toLocaleDateString()}</TableCell>}
                  {isVisible('category') && <TableCell className="px-6 py-3.5 text-sm font-medium text-foreground capitalize">{exp.category}</TableCell>}
                  {isVisible('description') && <TableCell className="px-6 py-3.5 text-sm text-text-secondary">{exp.description ?? '\u2014'}</TableCell>}
                  {isVisible('amount') && <TableCell className="px-6 py-3.5 text-right text-sm font-medium tabular-nums text-foreground">{formatCurrency(exp.amount)}</TableCell>}
                  {isVisible('status') && (
                    <TableCell className="px-6 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(exp.status)}`}>{formatLabel(exp.status)}</span>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-3.5">
                    <RowActionMenu actions={[
                      ...(exp.status === 'approved' ? [{
                        label: 'Mark Reimbursed',
                        onClick: () => setReimburseId(exp.id),
                      }] : []),
                      { label: 'Delete', variant: 'danger' as const, onClick: () => setDeleteId(exp.id) },
                    ]} />
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 && (
                <TableRow><TableCell colSpan={7} className="px-6 py-12 text-center text-sm text-text-muted">No expenses match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DataImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        entityType="Expenses"
        entityKey="expenses"
        apiEndpoint="/api/expenses"
        onComplete={() => router.refresh()}
      />

      {reimburseId && (
        <ConfirmDialog
          open
          title="Mark as Reimbursed"
          message="Are you sure you want to mark this expense as reimbursed? This action records the reimbursement."
          confirmLabel="Mark Reimbursed"
          variant="default"
          onConfirm={() => handleReimburse(reimburseId)}
          onCancel={() => setReimburseId(null)}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          open
          title="Delete Expense"
          message="Are you sure you want to delete this expense? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDeleteExpense(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <ColumnConfigPanel
        open={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columns={columns}
        onColumnsChange={setColumns}
        rowHeight={rowHeight}
        onRowHeightChange={setRowHeight}
      />
    </>
  );
}
