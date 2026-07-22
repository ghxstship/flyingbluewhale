"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Fab, KIcon, NormalizedList, SwipeRow, type FieldDef } from "@/components/mobile/kit";
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
  /** Display badge text (already translated by the server page). */
  time: string;
  /** Data flag: the item is currently checked out (issued/transferred). */
  out: boolean;
};

/**
 * Kit 28 `tab === "assets"` (My Gear) / kit 34 v3.4 — normalized onto
 * NormalizedList (search + View Options/Share drawers + schema DataView
 * list/table + category pills). Keeps the kit 31 swipe canon: Check In (ok,
 * only while Out — flips `fulfillment_state → returned` via the party self
 * check-in RPC) + Lost (danger — journals + alerts the manager band), the
 * optimistic session overlays, and the Request-Advance FAB.
 */
export function AssetsView({ rows, eyebrow, title }: { rows: AssetRow[]; eyebrow?: string; title: string }) {
  const t = useT();
  const toast = useToast();
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Optimistic: tags checked back in / reported lost via swipe this session.
  const [backIn, setBackIn] = useState<Set<string>>(new Set());
  const [lost, setLost] = useState<Set<string>>(new Set());

  const catList = Array.from(new Set(rows.map((r) => r.cat))).sort();
  const statusOf = (r: AssetRow) =>
    backIn.has(r.id)
      ? t("m.assets.returnedSub", undefined, "Returned")
      : r.out
        ? t("m.assets.group.checkedOut", undefined, "Checked Out")
        : t("m.assets.group.assigned", undefined, "Assigned");

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

  const FIELDS: FieldDef<AssetRow>[] = [
    { id: "title", label: t("m.assets.col.asset", undefined, "Asset"), type: "text", get: (r) => r.title },
    { id: "cat", label: t("m.assets.group.cat", undefined, "Category"), type: "select", options: catList, get: (r) => r.cat },
    { id: "tag", label: t("m.assets.col.tag", undefined, "Tag"), type: "text", get: (r) => r.tag },
    { id: "status", label: t("m.assets.col.status", undefined, "Status"), type: "select", get: (r) => statusOf(r) },
  ];

  const row = (r: AssetRow) => {
    const returned = backIn.has(r.id);
    const out = r.out && !returned;
    return (
      <SwipeRow
        key={r.id}
        onClick={() => router.push(`/m/advances/${r.id}`)}
        actions={[
          ...(out
            ? [{ icon: "PackageCheck", label: t("m.assets.checkIn", undefined, "Check In"), tone: "ok" as const, on: () => checkIn(r) }]
            : []),
          { icon: "TriangleAlert", label: t("m.assets.lost", undefined, "Lost"), tone: "danger" as const, on: () => reportLost(r) },
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

  return (
    <div className="screen screen-anim">
      <button
        type="button"
        className="backbtn"
        onClick={() => window.dispatchEvent(new CustomEvent("compvss:nav-open"))}
      >
        <KIcon name="ChevronLeft" size={17} /> {t("m.more.title", undefined, "More")}
      </button>
      {eyebrow && <div className="scr-eye">{eyebrow}</div>}
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {title}
      </h1>

      <NormalizedList
        k="as"
        items={rows}
        fields={FIELDS}
        search={(r) => `${r.title} ${r.sub} ${r.tag}`}
        searchPlaceholder={t("m.assets.search", undefined, "Search Assets…")}
        renderRow={row}
        views={["list", "table"]}
        pill={{ get: (r) => r.cat, order: catList }}
        empty={{
          cols: [
            t("m.assets.col.asset", undefined, "Asset"),
            t("m.assets.col.tag", undefined, "Tag"),
            t("m.assets.col.status", undefined, "Status"),
          ],
          title: t("m.assets.empty.title", undefined, "No Assets"),
          hint: t(
            "m.assets.empty.body",
            undefined,
            "Gear, credentials and vouchers issued to you land here. Request what you need from the catalog.",
          ),
        }}
      />

      {/* Kit FAB: Request Advance. */}
      <Fab href="/m/advances/new" label={t("m.assets.request", undefined, "Request Advance")} />
    </div>
  );
}
