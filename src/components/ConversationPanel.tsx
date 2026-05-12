import { listMessagesFor, type ConversationRecordType } from "@/lib/db/conversations";
import { getRequestFormatters } from "@/lib/i18n/request";
import { ConversationComposer } from "./ConversationComposer";

/**
 * Per-record threaded comments. Renders a chronological list of messages
 * (oldest first) plus a composer at the bottom. Backed by `conversations`
 * + `conversation_messages` — one thread per record.
 *
 * Server component: reads messages via Supabase. The composer is a small
 * client form that posts to a server action.
 */
export async function ConversationPanel({
  orgId,
  recordType,
  recordId,
}: {
  orgId: string;
  recordType: ConversationRecordType;
  recordId: string;
}) {
  const [messages, fmt] = await Promise.all([
    listMessagesFor(orgId, recordType, recordId),
    getRequestFormatters().then((f) => f.dateParts),
  ]);

  return (
    <section className="surface p-4">
      <h3 className="text-sm font-semibold">Conversation</h3>
      <div className="mt-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-[var(--text-muted)]">No messages yet. Start the thread below.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="surface-inset p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--foreground)]">
                {m.author_name ?? m.author_email ?? "Someone"}
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {fmt(m.created_at, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="mt-1 text-sm whitespace-pre-wrap">{m.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-[var(--border-color)] pt-3">
        <ConversationComposer recordType={recordType} recordId={recordId} />
      </div>
    </section>
  );
}
