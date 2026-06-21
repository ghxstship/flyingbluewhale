import Link from "next/link";
import { Repeat } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Shift Handover — end-of-shift report passing status, open items and
 * assets to the next crew. Reads the dedicated 3NF `handovers` table
 * (org-scoped, newest first) and links to the new-handover form.
 */
type HandoverRow = {
  id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  relief_label: string | null;
  post_state: string;
  summary: string;
  open_items: string | null;
  assets_passed: string | null;
  created_at: string;
};

const STATE_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  all_clear: "ok",
  watch_items: "warn",
  issues: "danger",
};

const TONE_VAR: Record<string, string> = {
  ok: "var(--p-success)",
  warn: "var(--p-warning)",
  danger: "var(--p-danger)",
  neutral: "var(--p-border)",
};

export default async function HandoverPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("handovers")
    .select("id, from_user_id, to_user_id, relief_label, post_state, summary, open_items, assets_passed, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  const handovers = (data ?? []) as HandoverRow[];

  // Resolve who handed off each report.
  const userIds = Array.from(new Set(handovers.map((h) => h.from_user_id).filter(Boolean) as string[]));
  const nameMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase.from("users").select("id, name, email").in("id", userIds);
    for (const u of (users ?? []) as Array<{ id: string; name: string | null; email: string | null }>) {
      nameMap.set(u.id, u.name ?? u.email ?? "");
    }
  }

  const STATE_LABEL: Record<string, string> = {
    all_clear: t("m.handover.state.allClear", undefined, "All Clear"),
    watch_items: t("m.handover.state.watchItems", undefined, "Watch Items"),
    issues: t("m.handover.state.issues", undefined, "Issues"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.handover.eyebrow", undefined, "Shift")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.handover.title", undefined, "Handover")}
      </h1>

      <Link
        href="/m/handover/new"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
      >
        <KIcon name="Repeat" size={16} /> {t("m.handover.new", undefined, "New Handover")}
      </Link>

      <div className="sech">
        <h2>{t("m.handover.prior", undefined, "Recent Handovers")}</h2>
      </div>
      {handovers.length === 0 ? (
        <EmptyState
          icon={<Repeat size={28} aria-hidden="true" />}
          title={t("m.handover.emptyTitle", undefined, "No Handovers")}
          description={t("m.handover.emptyBody", undefined, "Submit an end-of-shift handover to start the trail.")}
        />
      ) : (
        handovers.map((h) => {
          const tone = STATE_TONE[h.post_state] ?? "neutral";
          const stateLabel = STATE_LABEL[h.post_state] ?? h.post_state;
          const author = h.from_user_id ? nameMap.get(h.from_user_id) ?? "" : "";
          const relief = h.relief_label
            ? t("m.handover.handedTo", { relief: h.relief_label }, `Handed To ${h.relief_label}`)
            : "";
          const meta = [author, relief, `${fmt.date(h.created_at)} · ${fmt.time(h.created_at)}`]
            .filter(Boolean)
            .join(" · ");
          return (
            <div className="item" key={h.id} style={{ alignItems: "flex-start" }}>
              <span className="bar" style={{ background: TONE_VAR[tone] ?? "var(--p-accent)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t" style={{ whiteSpace: "pre-wrap" }}>{h.summary}</div>
                {h.open_items ? (
                  <div className="s" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>
                    {t("m.handover.openItems", undefined, "Open Items")}: {h.open_items}
                  </div>
                ) : null}
                {h.assets_passed ? (
                  <div className="s" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>
                    {t("m.handover.assets", undefined, "Assets / Keys")}: {h.assets_passed}
                  </div>
                ) : null}
                <div className="hint" style={{ marginTop: 4 }}>{meta}</div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
                {stateLabel}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
