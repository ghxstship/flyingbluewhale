import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { KIcon } from "@/components/mobile/kit";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { DocShareButton } from "./DocShareButton";

/**
 * COMPVSS · Article Detail — kit 28 `article-detail` (/m/docs/[id]).
 *
 * "SOP body, offline-cached badge, must-read acknowledgement action." The
 * body is the SOP's purpose + numbered steps (`sops.steps` jsonb). The kit's
 * offline-cached badge is not rendered: the repo's service worker
 * runtime-caches visited routes rather than precaching the library, and a
 * badge asserting "cached" on an article that may never have been visited
 * would be a lie about exactly the situation — no signal — where it matters.
 */
export const dynamic = "force-dynamic";

type Step = { title?: string; body?: string } | string;

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.docs.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: sop }, { data: ack }] = await Promise.all([
    supabase
      .from("sops")
      .select("id, code, title, purpose, category, must_read, steps, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .eq("sop_state", "published")
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("sop_acknowledgements")
      .select("acknowledged_at")
      .eq("sop_id", id)
      .eq("user_id", session.userId)
      .maybeSingle(),
  ]);
  if (!sop) notFound();

  const row = sop as {
    id: string;
    code: string;
    title: string;
    purpose: string | null;
    category: string | null;
    must_read: boolean;
    steps: unknown;
  };
  const steps: Step[] = Array.isArray(row.steps) ? (row.steps as Step[]) : [];
  const acked = Boolean(ack);

  return (
    <div className="screen screen-anim">
      <Link href="/m/docs" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.docs.title", undefined, "Knowledge")}
      </Link>
      <div className="scr-eye">
        <span style={{ fontFamily: "var(--p-mono)" }}>{row.code}</span>
        {row.category ? ` · ${row.category}` : ""}
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
        <h1 className="scr-h" style={{ flex: 1, marginBottom: 0 }}>
          {row.title}
        </h1>
        {/* Kit 32 A7 — share the doc within its access scope; the share writes
            an audit_log row noting the RBAC scope. */}
        <DocShareButton
          sopId={row.id}
          labels={{
            share: t("m.docs.share", undefined, "Share"),
            title: t("m.docs.share.title", undefined, "Share Article"),
            scopeWarning: t(
              "m.docs.share.scope",
              undefined,
              "This link respects access scope. Only members of your organization can open it.",
            ),
            shareAction: t("m.docs.share.action", undefined, "Share Link"),
            copyAction: t("m.docs.share.copy", undefined, "Copy Link"),
            copied: t("m.docs.share.copied", undefined, "Link Copied"),
            error: t("m.docs.share.error", undefined, "Could not share. Try again."),
            close: t("m.docs.share.close", undefined, "Close"),
          }}
        />
      </div>

      {row.purpose && (
        <div className="item" style={{ display: "block" }}>
          <div className="s" style={{ whiteSpace: "pre-wrap" }}>{row.purpose}</div>
        </div>
      )}

      {steps.length > 0 && (
        <>
          <div className="sech">
            <h2>{t("m.docs.steps", undefined, "Steps")}</h2>
          </div>
          {steps.map((s, i) => {
            const title = typeof s === "string" ? s : (s.title ?? "");
            const body = typeof s === "string" ? null : (s.body ?? null);
            return (
              <div className="item" key={i} style={{ alignItems: "flex-start" }}>
                <span
                  className="qi"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    fontFamily: "var(--p-mono)",
                    fontSize: 12,
                    fontWeight: 700,
                    background: "color-mix(in oklab, var(--p-accent) 14%, transparent)",
                    color: "var(--p-accent-text)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="t">{title}</div>
                  {body && <div className="s" style={{ whiteSpace: "pre-wrap" }}>{body}</div>}
                </div>
              </div>
            );
          })}
        </>
      )}

      {row.must_read && <AcknowledgeButton sopId={row.id} acked={acked} />}
    </div>
  );
}
