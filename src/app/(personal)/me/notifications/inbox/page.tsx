import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxClient, type InboxNotification, type InboxTab } from "./InboxClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const VALID_TABS: readonly InboxTab[] = ["all", "unread", "mentioned", "assigned"];

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

  if (!hasSupabase) {
    return (
      <div>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            All your activity across the platform — assignments, mentions, status changes.
          </p>
        </header>
        <EmptyState title="Inbox unavailable" description="Supabase is not configured in this environment." />
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          <Link href="/me/notifications" className="underline">
            Manage notification preferences
          </Link>
        </p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  let query = supabase
    .from("notifications")
    .select("id, kind, title, body, href, read_at, created_at")
    .eq("user_id", session.userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (tab === "unread") {
    query = query.is("read_at", null);
  } else if (tab === "mentioned") {
    // Phase 2 will populate this once the @mention pipeline lands. For now
    // we filter on event types that look like mentions so the tab is wired
    // up end-to-end and rows surface as soon as they exist.
    query = query.like("kind", "mention.%");
  } else if (tab === "assigned") {
    query = query.like("kind", "%.assigned");
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

  const notifications: InboxNotification[] = ((rows ?? []) as InboxNotification[]).map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    href: r.href,
    read_at: r.read_at,
    created_at: r.created_at,
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
