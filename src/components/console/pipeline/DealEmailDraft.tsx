'use client';

/**
 * DealEmailDraft — AI-powered email drafting for pipeline deals.
 *
 * Uses the AI SDK useChat hook with streaming for real-time generation.
 * Sends a structured prompt as a user message to the /api/ai/chat endpoint.
 *
 * @module components/admin/pipeline/DealEmailDraft
 */

import { useState, useId } from 'react';
import { Send, Loader2, Copy } from 'lucide-react';
import Button from '@/components/ui/Button';
import ModalShell from '@/components/ui/ModalShell';
import FormSelect from '@/components/ui/FormSelect';
import { formatCurrency } from '@/lib/utils';
import { useChat, type UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

interface DealEmailDraftProps {
  dealTitle: string;
  dealValue: number;
  dealStage: string;
  clientName: string;
  notes: string | null;
}

const TONES = [
  { value: 'check_in', label: 'Friendly check-in' },
  { value: 'proposal_followup', label: 'Proposal follow-up' },
  { value: 'meeting_request', label: 'Meeting request' },
  { value: 'closing', label: 'Closing push' },
] as const;

type Tone = typeof TONES[number]['value'];

function buildPrompt(props: DealEmailDraftProps, tone: Tone): string {
  const base = `Draft a professional sales follow-up email for a deal.

Deal: ${props.dealTitle}
Client: ${props.clientName}
Value: ${formatCurrency(props.dealValue)}
Current Stage: ${props.dealStage}
${props.notes ? `Context/Notes: ${props.notes}` : ''}

Tone: ${TONES.find((t) => t.value === tone)?.label ?? tone}

Rules:
- Be concise (2-3 paragraphs max)
- Sound professional but warm
- Include a clear call-to-action
- Don't use generic placeholder text like [Insert Name]
- Use the client name naturally
- Don't include a subject line
- Output ONLY the email body text, no preamble or explanation`;

  return base;
}

function getMessageText(msg: UIMessage): string {
  return (msg.parts ?? [])
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('');
}

export default function DealEmailDraft({
  dealTitle,
  dealValue,
  dealStage,
  clientName,
  notes,
}: DealEmailDraftProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>('check_in');
  const [copied, setCopied] = useState(false);
  const chatId = useId();

  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat({
    id: `deal-email-${chatId}`,
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: {
        context: {
          currentPage: '/app/pipeline',
          entityContext: {
            type: 'deal',
            name: dealTitle,
            id: 'email-draft',
          },
        },
      },
    }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  // Extract the last assistant message as the draft
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const draft = lastAssistant ? getMessageText(lastAssistant) : '';

  async function generateDraft() {
    const prompt = buildPrompt({ dealTitle, dealValue, dealStage, clientName, notes }, tone);
    // Clear previous messages and send new prompt
    setMessages([]);
    sendMessage({ text: prompt });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleOpen() {
    setOpen(true);
    setMessages([]);
    setCopied(false);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleOpen}
      >
        <Send size={14} className="mr-1.5" />
        Draft Follow-up
      </Button>

      <ModalShell open={open} onClose={() => setOpen(false)} title="AI Email Draft">
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-muted mb-1">Tone</label>
              <FormSelect value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                {TONES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </FormSelect>
            </div>
            <Button onClick={generateDraft} loading={isLoading} size="sm">
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-bg-secondary p-4 min-h-[160px]">
            <p className="text-xs text-text-muted mb-2">
              {dealTitle} — {clientName} — {formatCurrency(dealValue)}
            </p>
            {!draft && !isLoading && (
              <p className="text-sm text-text-muted italic">
                Choose a tone and click Generate to draft an email.
              </p>
            )}
            {isLoading && !draft && (
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Loader2 size={16} className="animate-spin" />
                Drafting email...
              </div>
            )}
            {draft && (
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {draft}
              </pre>
            )}
          </div>

          {draft && (
            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                <Copy size={14} className="mr-1" />
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
              <Button variant="secondary" size="sm" onClick={generateDraft}>
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </ModalShell>
    </>
  );
}
