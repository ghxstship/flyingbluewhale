"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity as ActivityIcon, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/Sheet";
import type { ActivityItem as ActivityItemType } from "@/lib/db/activity";
import { ActivityItem } from "./ActivityItem";
import { formatDateParts } from "@/lib/i18n/format";

export type ActivityDrawerProps = {
  targetTable: string;
  targetId: string;
  /** Server-loaded initial timeline (newest first). */
  initial: ActivityItemType[];
  /** Layout. Default `"inline"`. */
  mode?: "inline" | "sheet";
  /** Title override. Default `"Activity"`. */
  title?: string;
  /** Show a "Load more" button. */
  hasMore?: boolean;
  /** Server action that fetches the next page. */
  loadMore?: () => Promise<void>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function dayLabel(iso: string): string {
  const item = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  if (item === today) return "Today";
  if (item === today - DAY_MS) return "Yesterday";
  return formatDateParts(iso, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: item < today - 180 * DAY_MS ? "numeric" : undefined,
  });
}

/**
 * Group activity items by calendar day. Preserves the input order
 * (newest first) so the most recent day surfaces at the top.
 */
function groupByDay(items: ActivityItemType[]): Array<{ label: string; items: ActivityItemType[] }> {
  const groups: Array<{ label: string; items: ActivityItemType[] }> = [];
  let current: { label: string; items: ActivityItemType[] } | null = null;
  for (const item of items) {
    const label = dayLabel(item.occurredAt);
    if (!current || current.label !== label) {
      current = { label, items: [] };
      groups.push(current);
    }
    current.items.push(item);
  }
  return groups;
}

function TimelineBody({ items }: { items: ActivityItemType[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={<ActivityIcon size={20} />}
        title="No activity yet"
        description="Edits, transitions, and comments will surface here."
      />
    );
  }
  const groups = groupByDay(items);
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h4 className="mb-2 text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">
            {group.label}
          </h4>
          <ol className="relative space-y-3 border-s border-[var(--border-color)] ps-2">
            {group.items.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/**
 * Per-record timeline rendered from the `audit_log` table. SmartSuite
 * parity: https://help.smartsuite.com/en/articles/4855582-record-activity-history.
 *
 * Default mode is `"inline"` — the timeline renders directly on the page
 * (typically next to a `<CommentThread>`). Pass `mode="sheet"` to expose
 * a side-panel trigger instead.
 */
export function ActivityDrawer({
  initial,
  mode = "inline",
  title = "Activity",
  hasMore,
  loadMore,
}: ActivityDrawerProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<ActivityItemType[]>(initial);
  const [isPending, startTransition] = React.useTransition();

  React.useEffect(() => {
    setItems(initial);
  }, [initial]);

  function handleRefresh() {
    // Trigger a soft refresh of the parent server component so it re-fetches
    // and feeds a fresh `initial` prop into this drawer.
    router.refresh();
  }

  function handleLoadMore() {
    if (!loadMore) return;
    startTransition(async () => {
      await loadMore();
    });
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        <Badge variant="muted">{items.length}</Badge>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={handleRefresh} aria-label="Refresh activity">
        <RefreshCw size={14} aria-hidden="true" />
      </Button>
    </div>
  );

  const body = (
    <>
      <TimelineBody items={items} />
      {hasMore && loadMore && (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="secondary" size="sm" onClick={handleLoadMore} loading={isPending}>
            Load More
          </Button>
        </div>
      )}
    </>
  );

  if (mode === "sheet") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button type="button" variant="secondary" size="sm">
            <ActivityIcon size={14} className="me-1.5" aria-hidden="true" />
            {title}
            <Badge variant="muted" className="ms-2">
              {items.length}
            </Badge>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <section className="surface p-4" aria-label={title}>
      {header}
      <div className="mt-4">{body}</div>
    </section>
  );
}
