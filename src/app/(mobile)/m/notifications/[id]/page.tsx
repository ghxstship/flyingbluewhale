import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { NotificationDetail } from "./NotificationDetail";

export const dynamic = "force-dynamic";

/**
 * COMPVSS `/m/notifications/[id]` — the full notification record (kit 31,
 * live-test resolution #2). Fields, delivery timeline, the related-record
 * deep link (the row's REAL `href` payload ref — never inferred from copy),
 * mute (the per-kind matrix at /m/settings/notifications), and dismiss
 * (soft-delete). RLS scopes reads to the caller's own rows.
 */

const KIND_TONE: Record<string, "warn" | "ok" | "info" | "neutral"> = {
  alert: "warn",
  emergency: "warn",
  crisis: "warn",
  incident: "warn",
  approval: "ok",
  assignment_state: "ok",
  announcement: "info",
  assignment: "info",
  assignment_scan: "info",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase || !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, href, project_id, created_at, read_at, deleted_at")
    .eq("id", id)
    .eq("user_id", session.userId)
    .maybeSingle();
  const row = data as {
    id: string;
    kind: string;
    title: string;
    body: string | null;
    href: string | null;
    project_id: string | null;
    created_at: string;
    read_at: string | null;
    deleted_at: string | null;
  } | null;
  if (!row || row.deleted_at) notFound();

  let projectName: string | null = null;
  if (row.project_id) {
    const { data: proj } = await supabase.from("projects").select("name").eq("id", row.project_id).maybeSingle();
    projectName = (proj as { name: string } | null)?.name ?? null;
  }

  const tone = KIND_TONE[row.kind] ?? "neutral";
  const toneLabel =
    tone === "warn"
      ? t("m.alerts.filter.urgent", undefined, "Urgent")
      : tone === "ok"
        ? t("m.alerts.filter.approvals", undefined, "Approvals")
        : tone === "info"
          ? t("m.alerts.filter.updates", undefined, "Updates")
          : t("m.alerts.filter.general", undefined, "General"),
    kindLabel = toTitle(row.kind);

  // The related-record deep link is the notification's REAL payload ref.
  // Only same-app paths pass through (defense against a stored absolute URL).
  const related = row.href && row.href.startsWith("/") ? row.href : null;

  return (
    <NotificationDetail
      id={row.id}
      title={row.title}
      body={row.body}
      tone={tone}
      toneLabel={toneLabel}
      kindLabel={kindLabel}
      projectName={projectName}
      received={fmt.dateTime(row.created_at)}
      receivedRelative={fmt.relative(row.created_at)}
      readAt={row.read_at ? fmt.dateTime(row.read_at) : null}
      isRead={row.read_at != null}
      relatedHref={related}
    />
  );
}
