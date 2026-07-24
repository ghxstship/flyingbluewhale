import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Certification } from "@/lib/legend_compliance";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/certifications/definitions — the certification-type catalog
 * (L-P6b, blocker B-5). Manager+ defines the credentials the org certifies:
 * name, code, validity window, recert window. Page-gated like the engine
 * and training console. Archived types stay listed (soft facet) — holders
 * keep referencing them.
 */
export default async function CertificationDefinitionsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.certifications.definitions.eyebrow", undefined, "LEG3ND · Compliance")}
          title={t("console.legend.certifications.definitions.title", undefined, "Credential Types")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/certifications" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: certData }, { data: holderData }] = await Promise.all([
    db
      .from("legend_certifications")
      .select("id, org_id, code, name, description, validity_months, recert_window_days, certification_state")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("certification_state", { ascending: true })
      .order("name", { ascending: true }),
    db.from("certification_holders").select("certification_id").eq("org_id", session.orgId),
  ]);

  const certs = (certData ?? []) as Certification[];
  const holderCounts = new Map<string, number>();
  for (const h of (holderData ?? []) as { certification_id: string }[]) {
    holderCounts.set(h.certification_id, (holderCounts.get(h.certification_id) ?? 0) + 1);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.certifications.definitions.eyebrow", undefined, "LEG3ND · Compliance")}
        title={t("console.legend.certifications.definitions.title", undefined, "Credential Types")}
        subtitle={t(
          "console.legend.certifications.definitions.subtitle",
          undefined,
          "The credentials your org certifies: validity windows, recert periods, and retirement.",
        )}
        action={
          <Link href="/legend/certifications/definitions/new" className="ps-btn ps-btn--primary ps-btn--sm">
            {t("console.legend.certifications.definitions.new.cta", undefined, "New Credential Type")}
          </Link>
        }
      />
      {certs.length === 0 ? (
        <EmptyState
          title={t("console.legend.certifications.definitions.emptyTitle", undefined, "No credential types yet")}
          description={t(
            "console.legend.certifications.definitions.emptyDescription",
            undefined,
            "Define your first certification type; courses can then grant it on assessment pass.",
          )}
          action={
            <Link href="/legend/certifications/definitions/new" className="ps-btn ps-btn--primary">
              {t("console.legend.certifications.definitions.new.cta", undefined, "New Credential Type")}
            </Link>
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">{t("console.legend.certifications.definitions.col.code", undefined, "Code")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.certifications.definitions.col.name", undefined, "Name")}</th>
                <th className="px-3 py-2 text-right">{t("console.legend.certifications.definitions.col.validity", undefined, "Validity")}</th>
                <th className="px-3 py-2 text-right">{t("console.legend.certifications.definitions.col.window", undefined, "Recert window")}</th>
                <th className="px-3 py-2 text-right">{t("console.legend.certifications.definitions.col.holders", undefined, "Holders")}</th>
                <th className="px-3 py-2 text-left">{t("console.legend.certifications.definitions.col.state", undefined, "State")}</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c) => (
                <tr key={c.id} className="border-t border-[var(--p-border)]">
                  <td className="px-3 py-2 font-mono text-xs text-[var(--p-text-2)]">{c.code}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/legend/certifications/definitions/${c.id}`}
                      className="font-medium text-[var(--p-text-1)] hover:text-[var(--p-accent-text)] hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--p-text-2)]">
                    {c.validity_months
                      ? t("console.legend.certifications.definitions.months", { n: String(c.validity_months) }, `${c.validity_months} mo`)
                      : t("console.legend.certifications.never", undefined, "Never")}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--p-text-2)]">
                    {t("console.legend.certifications.definitions.days", { n: String(c.recert_window_days) }, `${c.recert_window_days} d`)}
                  </td>
                  <td className="px-3 py-2 text-right text-[var(--p-text-2)]">{holderCounts.get(c.id) ?? 0}</td>
                  <td className="px-3 py-2">
                    <Badge variant={c.certification_state === "active" ? "success" : "muted"}>
                      {c.certification_state === "active"
                        ? t("console.legend.certifications.definitions.state.active", undefined, "Active")
                        : t("console.legend.certifications.definitions.state.archived", undefined, "Retired")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
