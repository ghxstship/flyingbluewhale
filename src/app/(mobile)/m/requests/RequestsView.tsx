"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionBar, KIcon, TogRow } from "@/components/mobile/kit";
import type { ViewMode } from "@/components/mobile/kit";
import { EmptyState } from "@/components/ui/EmptyState";
import { useT } from "@/lib/i18n/LocaleProvider";
import { decideTimeOff, decideSwap } from "./actions";

export type RequestRow = {
  id: string;
  kind: "time_off" | "shift_swap";
  type: string;
  title: string;
  submitter: string;
  detail: string | null;
  state: string;
  submitted: string;
  meta: string | null;
};

const STATE_TONE: Record<string, string> = {
  pending: "warn",
  requested: "warn",
  approved: "ok",
  declined: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

function stateLabel(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function badgeClass(tone: string) {
  return `ps-badge ps-badge--${tone}`;
}

export function RequestsView({
  rows,
  manager,
  eyebrow,
  title,
}: {
  rows: RequestRow[];
  manager: boolean;
  eyebrow: string;
  title: string;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("list");
  const [sort, setSort] = useState("recent");
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Overtime guardrail (competitive parity): when a swap approval would
  // push the target worker over the weekly threshold, the action returns
  // otRisk instead of applying the decision. We stash it here and ask for
  // one more tap before resubmitting with force=1.
  const [otConfirm, setOtConfirm] = useState<{ id: string; projectedHours: number; thresholdHours: number } | null>(
    null,
  );

  const typeList = useMemo(() => Array.from(new Set(rows.map((r) => r.type))).sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rows
      .filter((r) => types.size === 0 || types.has(r.type))
      .filter((r) => !q || (r.title + " " + r.submitter + " " + r.type).toLowerCase().includes(q))
      .sort((a, b) => (sort === "type" ? a.type.localeCompare(b.type) : 0));
  }, [rows, query, types, sort]);

  const toggleType = (ty: string) =>
    setTypes((prev) => {
      const next = new Set(prev);
      if (next.has(ty)) next.delete(ty);
      else next.add(ty);
      return next;
    });

  const decide = (r: RequestRow, decision: "approved" | "declined", force?: boolean) => {
    if (pending) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", r.id);
    fd.set("decision", decision);
    if (force) fd.set("force", "1");
    startTransition(async () => {
      const res = r.kind === "time_off" ? await decideTimeOff(null, fd) : await decideSwap(null, fd);
      if (res?.otRisk) {
        setOtConfirm({ id: r.id, projectedHours: res.otRisk.projectedHours, thresholdHours: res.otRisk.thresholdHours });
        return;
      }
      if (res?.error) {
        setError(res.error);
        return;
      }
      setOtConfirm(null);
      router.refresh();
    });
  };

  const isOpen = (s: string) => s === "pending" || s === "requested";

  const row = (r: RequestRow) => {
    const tone = STATE_TONE[r.state] ?? "neutral";
    return (
      <div className="item" key={r.id} style={{ display: "block" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <KIcon
            name={r.kind === "time_off" ? "CalendarOff" : "ArrowLeftRight"}
            size={18}
            style={{ color: "var(--p-text-2)", flex: "none", marginTop: 2 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{r.title}</div>
            <div className="s">
              {r.type} · {r.submitter} · {r.submitted}
              {r.meta ? ` · ${r.meta}` : ""}
            </div>
          </div>
          <span className={badgeClass(tone)}>{stateLabel(r.state)}</span>
        </div>

        {/* RBAC approval chain: submitter → reviewer. */}
        <div className="appr-chain" style={{ marginTop: 10 }}>
          <div className="appr-step">
            <span className="appr-dot approved"><KIcon name="Check" size={12} /></span>
            <div style={{ flex: 1 }}>
              <div className="t" style={{ fontSize: 13 }}>{r.submitter}</div>
              <div className="s" style={{ fontSize: 11 }}>{t("m.requests.chain.submitter", undefined, "Submitter")}</div>
            </div>
            <span className={badgeClass("ok")}>{t("m.requests.chain.submitted", undefined, "Submitted")}</span>
          </div>
          <div className="appr-step">
            <span className={`appr-dot ${isOpen(r.state) ? "current" : "approved"}`}>
              {isOpen(r.state) ? <KIcon name="Clock" size={12} /> : <KIcon name="Check" size={12} />}
            </span>
            <div style={{ flex: 1 }}>
              <div className="t" style={{ fontSize: 13 }}>{t("m.requests.chain.reviewer", undefined, "Reviewer")}</div>
              <div className="s" style={{ fontSize: 11 }}>{t("m.requests.chain.managerPlus", undefined, "Manager+")}</div>
            </div>
            <span className={badgeClass(isOpen(r.state) ? "warn" : tone)}>
              {isOpen(r.state) ? t("m.requests.chain.reviewing", undefined, "Reviewing") : stateLabel(r.state)}
            </span>
          </div>
        </div>

        {r.detail && <p className="form-intro" style={{ margin: "8px 0 0" }}>{r.detail}</p>}

        {manager && isOpen(r.state) && otConfirm?.id === r.id && (
          <div className="ps-alert ps-alert--warn" style={{ marginTop: 10 }}>
            <div style={{ marginBottom: 8 }}>
              {t(
                "m.requests.swap.otWarning",
                { hours: otConfirm.projectedHours, threshold: otConfirm.thresholdHours },
                `This puts them at ${otConfirm.projectedHours}h this week, over the ${otConfirm.thresholdHours}h threshold.`,
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="ps-btn ps-btn--danger"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={pending}
                onClick={() => decide(r, "approved", true)}
              >
                {t("m.requests.swap.approveAnyway", undefined, "Approve Anyway")}
              </button>
              <button
                type="button"
                className="ps-btn ps-btn--ghost"
                style={{ flex: 1, justifyContent: "center" }}
                disabled={pending}
                onClick={() => setOtConfirm(null)}
              >
                {t("m.requests.swap.cancel", undefined, "Cancel")}
              </button>
            </div>
          </div>
        )}

        {manager && isOpen(r.state) && otConfirm?.id !== r.id && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={pending}
              onClick={() => decide(r, "approved")}
            >
              <KIcon name="Check" size={15} /> {t("m.requests.approve", undefined, "Approve")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--danger ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              disabled={pending}
              onClick={() => decide(r, "declined")}
            >
              <KIcon name="X" size={15} /> {t("m.requests.decline", undefined, "Decline")}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{title}</h1>

      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <ActionBar
        k="req"
        query={query}
        setQuery={setQuery}
        placeholder={t("m.requests.search", undefined, "Search Approvals…")}
        view={view}
        setView={setView}
        views={["list"]}
        sort={sort}
        setSort={setSort}
        sortOpts={[
          ["recent", t("m.requests.sort.recent", undefined, "Recent")],
          ["type", t("m.requests.sort.type", undefined, "Type")],
        ]}
        filterActive={types.size}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        filterChildren={
          <div>
            {typeList.map((ty) => (
              <TogRow key={ty} label={ty} on={types.has(ty)} set={() => toggleType(ty)} />
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          size="compact"
          title={t("m.requests.empty.title", undefined, "All Clear")}
          description={t("m.requests.empty.body", undefined, "Time-off and shift-swap requests appear here.")}
        />
      ) : (
        filtered.map(row)
      )}
    </div>
  );
}
