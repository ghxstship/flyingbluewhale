import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRequestT } from "@/lib/i18n/request";
import { InboxClient, type InboxNotification, type InboxTab } from "./InboxClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const VALID_TABS: readonly InboxTab[] = ["all", "unread", "mentioned", "assigned", "snoozed", "done"];

function parseTab(raw: string | string[] | undefined): InboxTab {
  if (typeof raw === "string" && (VALID_TABS as readonly string[]).includes(raw)) {
    return raw as InboxTab;
  }
  return "unread";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function InboxPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div>
        <header className="mb-6">
          <h1>{t("me.inbox.title", undefined, "Inbox")}</h1>
          <p className="mt-2 text-sm text-[var(--p-text-2)]">
            {t(
              "me.inbox.subtitle",
              undefined,
              "All your activity across the platform: assignments, mentions, status changes.",
            )}
          </p>
        </header>
        <EmptyState
          title={t("me.inbox.unavailable.title", undefined, "Inbox unavailable")}
          description={t(
            "me.inbox.unavailable.description",
            undefined,
            "Supabase is not configured in this environment.",
          )}
        />
        <p className="mt-4 text-xs text-[var(--p-text-2)]">
          <Link href="/me/notifications" className="underline">
            {t("me.inbox.managePreferences", undefined, "Manage notification preferences")}
          </Link>
        </p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  let query = supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at, done_at, snoozed_until")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (tab === "unread") {
    // Active inbox: unread, not done, not currently snoozed.
    query = query.is("read_at", null).is("done_at", null).or(`snoozed_until.is.null,snoozed_until.lt.${nowIso}`);
  } else if (tab === "mentioned") {
    query = query.like("kind", "mention.%").is("done_at", null);
  } else if (tab === "assigned") {
    query = query.like("kind", "%.assigned").is("done_at", null);
  } else if (tab === "snoozed") {
    query = query.gt("snoozed_until", nowIso).is("done_at", null);
  } else if (tab === "done") {
    query = query.not("done_at", "is", null);
  } else {
    // "all" — exclude done so the default view stays clean.
    query = query.is("done_at", null);
  }

  const [{ data: rows, error }, { count: unreadCount }] = await Promise.all([
    query,
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.userId)
      .is("deleted_at", null)
      .is("read_at", null),
  ]);

  // Cast through unknown — done_at / snoozed_until were added in
  // migration 20260523210000 but database.types.ts hasn't been
  // regenerated. Safe because the underlying columns exist + the
  // shape is locally typed.
  const notifications: InboxNotification[] = (
    (rows ?? []) as unknown as Array<InboxNotification & { done_at?: string | null; snoozed_until?: string | null }>
  ).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    href: r.href,
    read_at: r.read_at,
    created_at: r.created_at,
    done_at: r.done_at ?? null,
    snoozed_until: r.snoozed_until ?? null,
  }));

  return (
    <InboxClient
      tab={tab}
      notifications={notifications}
      unreadCount={unreadCount ?? 0}
      loadError={error?.message ?? null}
    />
  );
}
