import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import type { Certification } from "@/lib/legend_compliance";
import { getRequestT } from "@/lib/i18n/request";
import { DefinitionForm } from "../DefinitionForm";
import { setCertificationStateAction, updateCertificationAction } from "../actions";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * /legend/certifications/definitions/[certId] — edit a certification type +
 * the retire/restore facet. Retirement is soft (`certification_state =
 * 'archived'`): holders keep their artifacts and the public verify RPC keeps
 * answering, the type just stops appearing in active pickers and the wallet's
 * active-catalog read.
 */
export default async function CertificationDefinitionDetailPage({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase || !UUID_RE.test(certId)) notFound();
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend/certifications" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: certRow }, { count: holderCount }] = await Promise.all([
    db
      .from("legend_certifications")
      .select("id, org_id, code, name, description, validity_months, recert_window_days, certification_state")
      .eq("org_id", session.orgId)
      .eq("id", certId)
      .is("deleted_at", null)
      .maybeSingle(),
    db
      .from("certification_holders")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("certification_id", certId),
  ]);
  if (!certRow) notFound();
  const cert = certRow as Certification;
  const active = cert.certification_state === "active";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.certifications.definitions.eyebrow", undefined, "LEG3ND · Compliance")}
        title={cert.name}
        subtitle={
          <span className="inline-flex items-center gap-2">
            <span className="font-mono text-xs">{cert.code}</span>
            <Badge variant={active ? "success" : "muted"}>
              {active
                ? t("console.legend.certifications.definitions.state.active", undefined, "Active")
                : t("console.legend.certifications.definitions.state.archived", undefined, "Retired")}
            </Badge>
            <span>
              {t(
                "console.legend.certifications.definitions.holderCount",
                { n: String(holderCount ?? 0) },
                `${holderCount ?? 0} holders`,
              )}
            </span>
          </span>
        }
        breadcrumbs={[
          { label: t("console.legend.certifications.definitions.breadcrumbRoot", undefined, "LEG3ND") },
          {
            label: t("console.legend.certifications.definitions.title", undefined, "Credential Types"),
            href: "/legend/certifications/definitions",
          },
          { label: cert.code },
        ]}
        action={
          <form action={setCertificationStateAction.bind(null, cert.id, active ? "archived" : "active")}>
            <button type="submit" className="ps-btn ps-btn--secondary ps-btn--sm">
              {active
                ? t("console.legend.certifications.definitions.retire", undefined, "Retire")
                : t("console.legend.certifications.definitions.restore", undefined, "Restore")}
            </button>
          </form>
        }
      />
      <div className="page-content max-w-2xl space-y-4">
        {!active && (
          <p className="text-sm text-[var(--p-text-2)]">
            {t(
              "console.legend.certifications.definitions.retiredNote",
              undefined,
              "Retired: existing holders keep their certificates and verification stays live, but this type no longer appears in active catalogs.",
            )}
          </p>
        )}
        <DefinitionForm
          action={updateCertificationAction.bind(null, cert.id)}
          certification={cert}
          submitLabel={t("console.legend.certifications.definitions.edit.submit", undefined, "Save Changes")}
        />
      </div>
    </>
  );
}
