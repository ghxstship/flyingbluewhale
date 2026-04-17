'use client';

import { X } from 'lucide-react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import InvoicePreview from './InvoicePreview';
import FormSelect from '@/components/ui/FormSelect';
import FormTextarea from '@/components/ui/FormTextarea';
import Alert from '@/components/ui/Alert';
import FormInput from '@/components/ui/FormInput';
import FormLabel from '@/components/ui/FormLabel';
import Button from '@/components/ui/Button';

interface SelectOption {
  id: string;
  label: string;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  tax_rate: number;
}

export default function InvoiceForm({
  clients,
  proposals,
}: {
  clients: SelectOption[];
  proposals: SelectOption[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [type, setType] = useState('deposit');
  const [dueDate, setDueDate] = useState('');
  const [memo, setMemo] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, rate: 0, tax_rate: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = lineItems.reduce((s, li) => s + li.quantity * li.rate, 0);
  const taxTotal = lineItems.reduce((s, li) => {
    const lineAmount = li.quantity * li.rate;
    return s + Math.round(lineAmount * (li.tax_rate / 100) * 100) / 100;
  }, 0);
  const total = subtotal + taxTotal;

  async function handleSave(andSend: boolean) {
    setError(null);
    const setLoading = andSend ? setSending : setSaving;
    setLoading(true);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          proposal_id: proposalId || undefined,
          type,
          due_date: dueDate,
          memo,
          line_items: lineItems,
          status: 'draft',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to create invoice.');
        setLoading(false);
        return;
      }

      const invoiceId = data.invoice?.id;

      if (andSend && invoiceId) {
        const sendRes = await fetch(`/api/invoices/${invoiceId}/send`, {
          method: 'POST',
        });
        if (!sendRes.ok) {
          const sendData = await sendRes.json();
          setError(sendData.error ?? 'Invoice created but sending failed.');
          setLoading(false);
          router.push(`/app/invoices/${invoiceId}`);
          return;
        }
      }

      if (invoiceId) {
        router.push(`/app/invoices/${invoiceId}`);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, rate: 0, tax_rate: 0 }]);
  }

  function updateLineItem(index: number, patch: Partial<LineItem>) {
    setLineItems(
      lineItems.map((li, i) => (i === index ? { ...li, ...patch } : li))
    );
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  const clientName =
    clients.find((c) => c.id === clientId)?.label ?? 'Select client';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Invoice Details</h2>

          <div>
            <FormLabel>Client</FormLabel>
            <FormSelect
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </FormSelect>
          </div>

          <div>
            <FormLabel>
              Linked Proposal (optional)
            </FormLabel>
            <FormSelect
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}>
              <option value="">None</option>
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </FormSelect>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel>Type</FormLabel>
              <FormSelect
                value={type}
                onChange={(e) => setType(e.target.value)}>
                <option value="deposit">Deposit</option>
                <option value="balance">Balance</option>
                <option value="change_order">Change Order</option>
                <option value="addon">Add-on</option>
                <option value="final">Final</option>
                <option value="recurring">Recurring</option>
              </FormSelect>
            </div>
            <div>
              <FormLabel>Due Date</FormLabel>
              <FormInput
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div>
            <FormLabel>Memo</FormLabel>
            <FormTextarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-xl border border-border bg-background p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Line Items</h2>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={addLineItem}
            >
              + Add item
            </Button>
          </div>

          {lineItems.map((li, index) => (
            <div key={index} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                <FormLabel>Description</FormLabel>
                <FormInput
                  type="text"
                  value={li.description}
                  onChange={(e) => updateLineItem(index, { description: e.target.value })} />
              </div>
              <div className="col-span-1">
                <FormLabel>Qty</FormLabel>
                <FormInput
                  type="number"
                  min={1}
                  value={li.quantity}
                  onChange={(e) => updateLineItem(index, { quantity: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <FormLabel>Rate</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  step="0.01"
                  value={li.rate}
                  onChange={(e) => updateLineItem(index, { rate: Number(e.target.value) })} />
              </div>
              <div className="col-span-2">
                <FormLabel>Tax %</FormLabel>
                <FormInput
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={li.tax_rate}
                  onChange={(e) => updateLineItem(index, { tax_rate: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-sm tabular-nums text-foreground font-medium whitespace-nowrap">
                  ${(li.quantity * li.rate * (1 + li.tax_rate / 100)).toFixed(2)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length <= 1}
                  className="text-text-muted hover:text-red-600 p-1"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <Alert className="mb-4">{error}</Alert>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            disabled={saving || sending}
            onClick={() => handleSave(false)}
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            type="button"
            disabled={saving || sending}
            onClick={() => handleSave(true)}
          >
            {sending ? 'Sending...' : 'Create & Send'}
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div>
        <InvoicePreview
          clientName={clientName}
          invoiceNumber="(Draft)"
          lineItems={lineItems}
          total={total}
          memo={memo}
          dueDate={dueDate}
        />
      </div>
    </div>
  );
}
