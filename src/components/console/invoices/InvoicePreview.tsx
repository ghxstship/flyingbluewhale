'use client';

import { formatCurrencyDetailed } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
}

interface InvoicePreviewProps {
  clientName: string;
  invoiceNumber: string;
  lineItems: LineItem[];
  total: number;
  memo: string;
  dueDate: string;
}

export default function InvoicePreview({
  clientName,
  invoiceNumber,
  lineItems,
  total,
  memo,
  dueDate,
}: InvoicePreviewProps) {
  return (
    <div className="sticky top-8 rounded-xl border border-border bg-background p-8 shadow-sm">
      <div className="text-center mb-6">
        <p className="text-xs uppercase tracking-wider text-text-muted">Invoice Preview</p>
      </div>

      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center mb-2">
            <span className="text-white text-xs font-semibold">FD</span>
          </div>
          <p className="text-xs text-text-muted">Meridian Experiential</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{invoiceNumber}</p>
          {dueDate && (
            <p className="text-xs text-text-muted mt-1">
              Due: {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-xs text-text-muted">Bill To</p>
        <p className="text-sm font-medium text-foreground">{clientName}</p>
      </div>

      <div className="overflow-x-auto">
      <Table className="w-full mb-4 text-xs">
        <TableHeader>
          <TableRow className="border-b border-border">
            <TableHead className="py-2 text-left text-text-muted font-medium">Item</TableHead>
            <TableHead className="py-2 text-right text-text-muted font-medium">Qty</TableHead>
            <TableHead className="py-2 text-right text-text-muted font-medium">Rate</TableHead>
            <TableHead className="py-2 text-right text-text-muted font-medium">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody >
          {lineItems.map((li, i) => (
            <TableRow key={i}>
              <TableCell className="py-2 text-foreground">{li.description || '(empty)'}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-text-secondary">{li.quantity}</TableCell>
              <TableCell className="py-2 text-right tabular-nums text-text-secondary">{formatCurrencyDetailed(li.rate)}</TableCell>
              <TableCell className="py-2 text-right tabular-nums font-medium text-foreground">{formatCurrencyDetailed(li.quantity * li.rate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {(() => {
        const hasTax = lineItems.some((li) => (li.tax_rate ?? 0) > 0);
        const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
        const taxAmount = lineItems.reduce((s, li) => {
          const amt = li.quantity * li.rate;
          return s + Math.round(amt * ((li.tax_rate ?? 0) / 100) * 100) / 100;
        }, 0);
        return (
          <div className="border-t border-border pt-3 space-y-1">
            {hasTax && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Subtotal</span>
                  <span className="text-xs tabular-nums text-text-secondary">{formatCurrencyDetailed(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-text-muted">Tax</span>
                  <span className="text-xs tabular-nums text-text-secondary">{formatCurrencyDetailed(taxAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-semibold text-foreground">Total</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{formatCurrencyDetailed(total)}</span>
            </div>
          </div>
        );
      })()}

      {memo && (
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-xs text-text-muted">Memo</p>
          <p className="text-xs text-text-secondary mt-1">{memo}</p>
        </div>
      )}
    </div>
  );
}
