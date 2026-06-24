import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { CHANNEL_KIND_LABEL, countMessagesByChannel, isChannelKind, type ChannelRow } from "@/lib/messaging/queries";

export const dynamic = "force-dynamic";

export default async function ChannelsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.comms.channels.eyebrow", undefined, "Comms")}
          title={t("console.comms.channels.title", undefined, "Channels")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.comms.channels.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("message_channels")
    .select("id, org_id, kind, name, topic, project_id, external_provider, external_channel_id, archived, created_at")
    .eq("org_id", session.orgId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as ChannelRow[];
  const counts = await countMessagesByChannel(rows.map((r) => r.id));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.comms.channels.eyebrow", undefined, "Comms")}
        title={t("console.comms.channels.title", undefined, "Channels")}
        subtitle={
          rows.length === 1
            ? t("console.comms.channels.subtitleOne", { count: rows.length }, `${rows.length} channel`)
            : t("console.comms.channels.subtitleOther", { count: rows.length }, `${rows.length} channels`)
        }
        action={
          <Button href="/studio/comms/channels/new" size="sm">
            {t("console.comms.channels.newLabel", undefined, "+ New Channel")}
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.comms.channels.emptyLabel", undefined, "No Channels Yet")}
            description={t(
              "console.comms.channels.emptyDescription",
              undefined,
              "Spin up a group, project, or direct channel to keep the conversation in one threaded place.",
            )}
            action={
              <Button href="/studio/comms/channels/new" size="sm">
                {t("console.comms.channels.createFirst", undefined, "Create Your First Channel")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const count = counts[r.id] ?? 0;
              const kindLabel = isChannelKind(r.kind) ? CHANNEL_KIND_LABEL[r.kind] : r.kind;
              return (
                <Card key={r.id} href={`/studio/comms/channels/${r.id}`} interactive>
                  <div className="flex items-start justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-[var(--p-text-1)]">
                        {r.name ?? t("console.comms.channels.untitled", undefined, "Untitled channel")}
                      </div>
                      {r.topic && <div className="mt-1 line-clamp-2 text-xs text-[var(--p-text-2)]">{r.topic}</div>}
                      <div className="mt-2 font-mono text-[11px] text-[var(--p-text-3)]">
                        {count === 1
                          ? t("console.comms.channels.messageCountOne", { count }, `${count} message`)
                          : t("console.comms.channels.messageCountOther", { count }, `${count} messages`)}
                      </div>
                    </div>
                    <Badge variant="muted">{kindLabel}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
