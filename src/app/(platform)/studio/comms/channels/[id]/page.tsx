import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { getOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CHANNEL_KIND_LABEL, isChannelKind, listChannelMessages, type ChannelRow } from "@/lib/messaging/queries";
import { PostMessageForm } from "./PostMessageForm";

export const dynamic = "force-dynamic";

export default async function ChannelPage({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        {t("console.comms.channels.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const { id } = await params;
  const session = await requireSession();

  // `messages` has no org_id — verify the channel is org-scoped first, then
  // read its messages via channel_id.
  const channel = (await getOrgScoped("message_channels", session.orgId, id)) as ChannelRow | null;
  if (!channel) notFound();

  const messages = await listChannelMessages(channel.id, 200);
  const kindLabel = isChannelKind(channel.kind) ? CHANNEL_KIND_LABEL[channel.kind] : channel.kind;

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.channels.detail.eyebrow", undefined, "Channel")}
        title={channel.name ?? t("console.comms.channels.untitled", undefined, "Untitled channel")}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{kindLabel}</Badge>
            {channel.topic && <span className="text-xs text-[var(--p-text-2)]">{channel.topic}</span>}
          </span>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="space-y-2">
          {messages.length === 0 ? (
            <EmptyState
              title={t("console.comms.channels.detail.emptyLabel", undefined, "No Messages Yet")}
              description={t(
                "console.comms.channels.detail.emptyDescription",
                undefined,
                "Be the first to post in this channel.",
              )}
            />
          ) : (
            messages.map((m) => (
              <div key={m.id} className="surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[var(--p-text-3)]">
                    {m.author_party_id ?? t("console.comms.channels.detail.unknownAuthor", undefined, "Unknown")}
                  </span>
                  <span className="font-mono text-[11px] text-[var(--p-text-3)]">
                    {dateFmt.format(new Date(m.created_at))}
                  </span>
                </div>
                <div className="mt-1 text-sm whitespace-pre-wrap text-[var(--p-text-1)]">{m.body_markdown}</div>
              </div>
            ))
          )}
        </section>
        <PostMessageForm
          channelId={channel.id}
          placeholder={t("console.comms.channels.detail.postPlaceholder", undefined, "Write a message…")}
          submitLabel={t("console.comms.channels.detail.postSubmit", undefined, "Post")}
        />
      </div>
    </>
  );
}
