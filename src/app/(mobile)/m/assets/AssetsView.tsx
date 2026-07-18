"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActionBar,
  EmptySkeleton,
  Fab,
  GroupedList,
  SwipeRow,
  TogRow,
} from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { checkinMyAssignment, reportAssignmentLost } from "./actions";

export type AssetRow = {
  id: string;
  cat: string;
  title: string;
  sub: string;
  tag: string;
  tone: "ok" | "info" | "neutral" | "danger";
  time: string;
};

/**
 * Kit 28 `tab === "assets"` + the kit 31 (v2.7) swipe canon: eyebrow count,
 * "My Assets", the shared ActionBar (list/table · group None|Category|Status ·
 * sort Name|Status|Tag · category filter chips), `.item.tap` rows with a
 * leading `.bar`, mono tag in the sub-line, and a tone Badge carrying the
 * return state. Swipe: Check In (ok, ONLY while the unit is Out — flips
 * `fulfillment_state → returned` through the party self check-in RPC) and
 * Lost (danger — journals `Reported lost` + pushes the ops alert to the
 * manager band). FAB = Request Advance.
 */
export function AssetsView({ rows, eyebrow, title }: { rows: AssetRow[]; eyebrow: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [group, setGroup] = useState("none");
  const [sort, setSort] = useState("name");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Optimistic: tags checked back in via swipe this session.
  const [backIn, setBackIn] = useState<Set<string>>(new Set());
  const [lost, setLost] = useState<Set<string>>(new Set());

  const catList = useMemo(() => Array.from(new Set(rows.map((r) => r.cat))).sort(), [rows]);

  const items = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => cats.size === 0 || cats.has(r.cat))
      .filter((r) => !q || `${r.title} ${r.sub} ${r.tag}`.toLowerCase().includes(q))
      .sort((x, y) =>
        sort === "status" ? x.time.localeCompare(y.time) : sort === "tag" ? x.tag.localeCompare(y.tag) : x.title.localeCompare(y.title),
      );
  }, [rows, query, cats, sort]);

  const toggleCat = (c: string) =>
    setCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const checkIn = (r: AssetRow) => {
    setBackIn((s) => new Set(s).add(r.id));
    const fd = new FormData();
    fd.set("assignmentId", r.id);
    startTransition(async () => {
      const res = await checkinMyAssignment(null, fd);
      if (res?.error) {
        setBackIn((s) => {
          const n = new Set(s);
          n.delete(r.id);
          return n;
        });
        toast.error(res.error);
        return;
      }
      toast.success(t("m.assets.checkedIn", undefined, "Checked In"), { description: `${r.title} · ${r.tag}` });
      router.refresh();
    });
  };

  const reportLost = (r: AssetRow) => {
    setLost((s) => new Set(s).add(r.id));
    const fd = new FormData();
    fd.set("assignmentId", r.id);
    startTransition(async () => {
      const res = await reportAssignmentLost(null, fd);
      if (res?.error) {
        setLost((s) => {
          const n = new Set(s);
          n.delete(r.id);
          return n;
        });
        toast.error(res.error);
        return;
      }
      toast.warning(t("m.assets.reportedLost", undefined, "Reported Lost"), {
        description: t("m.assets.opsNotified", undefined, "Ops has been alerted"),
      });
      router.refresh();
    });
  };

  const row = (r: AssetRow) => {
    const returned = backIn.has(r.id);
    const out = r.time === "Out" && !returned;
    return (
      <SwipeRow
        key={r.id}
        onClick={() => router.push(`/m/advances/${r.id}`)}
        actions={[
          ...(out
            ? [
                {
                  icon: "PackageCheck",
                  label: t("m.assets.checkIn", undefined, "Check In"),
                  tone: "ok" as const,
                  on: () => checkIn(r),
                },
              ]
            : []),
          {
            icon: "TriangleAlert",
            label: t("m.assets.lost", undefined, "Lost"),
            tone: "danger" as const,
            on: () => reportLost(r),
          },
        ]}
      >
        <div className="item tap" style={{ margin: 0, cursor: "pointer" }}>
          <span className="bar" />
          <div>
            <div className="t">{r.title}</div>
            <div className="s">
              {returned ? t("m.assets.returnedSub", undefined, "Returned · Checked In") : r.sub}
              {" · "}
              <span style={{ fontFamily: "var(--p-mono)" }}>{r.tag}</span>
              {lost.has(r.id) && (
                <span style={{ color: "var(--p-danger)" }}> · {t("m.assets.lostTag", undefined, "Reported Lost")}</span>
              )}
            </div>
          </div>
          <span className="sp" />
          <span className={`ps-badge ps-badge--${returned ? "ok" : r.tone}`}>{returned ? "✓" : r.time}</span>
        </div>
      </SwipeRow>
    );
  };

  const groups = useMemo(() => {
    if (group === "cat") {
      const m = new Map<string, AssetRow[]>();
      items.forEach((r) => m.set(r.cat, [...(m.get(r.cat) ?? []), r]));
      return catList.filter((c) => m.has(c)).map((c) => [c, m.get(c) ?? []] as [string, AssetRow[]]);
    }
    if (group === "status") {
      // Kit: "Checked Out" vs "Assigned" buckets by the unit's Out marker.
      const outLabel = t("m.assets.group.checkedOut", undefined, "Checked Out");
      const inLabel = t("m.assets.group.assigned", undefined, "Assigned");
      const m = new Map<string, AssetRow[]>();
      items.forEach((r) => {
        const k = r.time === "Out" && !backIn.has(r.id) ? outLabel : inLabel;
        m.set(k, [...(m.get(k) ?? []), r]);
      });
      return Array.from(m.entries());
    }
    return null;
  }, [group, items, catList, backIn, t]);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <ActionBar
        k="as"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.assets.search", undefined, "Search Assets…")}
        view={view}
        setView={setView}
        views={["list", "table"]}
        group={group}
        setGroup={setGroup}
        groupOpts={[
          ["none", t("m.assets.group.none", undefined, "None")],
          ["cat", t("m.assets.group.cat", undefined, "Category")],
          ["status", t("m.assets.group.status", undefined, "Status")],
        ]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["name", t("m.assets.sort.name", undefined, "Name")],
          ["status", t("m.assets.sort.status", undefined, "Status")],
          ["tag", t("m.assets.sort.tag", undefined, "Tag")],
        ]}
        filterActive={cats.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            <div className="wl" style={{ marginBottom: 8 }}>
              {t("m.assets.category", undefined, "Category")}
            </div>
            {catList.map((c) => (
              <TogRow key={c} label={c} on={cats.has(c)} set={() => toggleCat(c)} />
            ))}
          </div>
        }
      />

      {!items.length ? (
        <EmptySkeleton
          cols={[
            t("m.assets.col.asset", undefined, "Asset"),
            t("m.assets.col.tag", undefined, "Tag"),
            t("m.assets.col.status", undefined, "Status"),
          ]}
          title={t("m.assets.empty.title", undefined, "No Assets")}
          hint={t(
            "m.assets.empty.body",
            undefined,
            "Gear, credentials and vouchers issued to you land here. Request what you need from the catalog.",
          )}
        />
      ) : groups ? (
        <GroupedList<AssetRow> skey="as" groups={groups} collapsed={collapsed} setCollapsed={setCollapsed} renderRow={row} />
      ) : (
        items.map(row)
      )}

      {/* Kit FAB: Request Advance. */}
      <Fab href="/m/advances/new" label={t("m.assets.request", undefined, "Request Advance")} />
    </div>
  );
}
