import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { MONO_CELL_CLASS } from "@/components/views/data-view-model";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type CredentialRow = {
  id: string;
  kind: string;
  number: string | null;
  issued_on: string | null;
  expires_on: string | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.training.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.training.title", undefined, "Training")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.training.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("credentials")
    .select("id, kind, number, issued_on, expires_on")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .limit(500);
  const rows = (data ?? []) as CredentialRow[];

  const now = Date.now();
  const expiringSoon = rows.filter((r) => {
    if (!r.expires_on) return false;
    const days = (new Date(r.expires_on).getTime() - now) / 86_400_000;
    return days >= 0 && days <= 60;
  }).length;
  const expired = rows.filter((r) => r.expires_on && new Date(r.expires_on).getTime() < now).length;

  // Aggregate by kind for quick triage
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const kindEntries = Object.entries(byKind).sort((a, b) => b[1] - a[1]);

  const credentialsLabel =
    rows.length === 1
      ? t("console.workforce.training.credentialSingular", undefined, "Credential")
      : t("console.workforce.training.credentialPlural", undefined, "Credentials");
  const subtitle = t(
    "console.workforce.training.subtitle",
    { count: rows.length, credentialsLabel, expiringSoon, expired },
    `${rows.length} ${credentialsLabel} On File · ${expiringSoon} Expiring Within 60 Days · ${expired} Expired`,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.training.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.training.title", undefined, "Training")}
        subtitle={subtitle}
        action={
          <Button href="/studio/people/credentials/new" size="sm">
            {t("console.workforce.training.addCredential", undefined, "+ Add credential")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {kindEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.workforce.training.byCertificationKind", undefined, "By Certification Kind")}
            </h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {kindEntries.map(([kind, count]) => (
                <li key={kind} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--p-text-2)]">{kind}</span>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataView<CredentialRow>
          rows={rows}
          rowHref={(r) => `/studio/people/credentials/${r.id}`}
          emptyLabel={t("console.workforce.training.emptyLabel", undefined, "No training credentials tracked")}
          emptyDescription={t(
            "console.workforce.training.emptyDescription",
            undefined,
            "Training is tracked alongside other certifications. Add first-aid, working-at-height, RIGGER, SIA, and similar issued certs to surface them here.",
          )}
          emptyAction={
            <Button href="/studio/people/credentials/new" size="sm">
              {t("console.workforce.training.addCredential", undefined, "+ Add credential")}
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: t("console.workforce.training.columns.kind", undefined, "Kind"),
              render: (r) => r.kind,
              accessor: (r) => r.kind,
              filterable: true,
              groupable: true,
            },
            {
              key: "number",
              header: t("console.workforce.training.columns.number", undefined, "Number"),
              render: (r) => r.number ?? "—",
              mono: true,
              accessor: (r) => r.number ?? null,
            },
            {
              key: "issued",
              header: t("console.workforce.training.columns.issued", undefined, "Issued"),
              render: (r) => formatDate(r.issued_on, "medium"),
              mono: true,
              accessor: (r) => r.issued_on,
            },
            {
              key: "expires",
              header: t("console.workforce.training.columns.expires", undefined, "Expires"),
              render: (r) => {
                if (!r.expires_on) return "—";
                const days = Math.ceil((new Date(r.expires_on).getTime() - now) / 86_400_000);
                if (days < 0)
                  return (
                    <Badge variant="error">
                      {t(
                        "console.workforce.training.expiredAgo",
                        { days: Math.abs(days) },
                        `Expired ${Math.abs(days)}d ago`,
                      )}
                    </Badge>
                  );
                if (days <= 30)
                  return (
                    <Badge variant="warning">{t("console.workforce.training.daysShort", { days }, `${days}d`)}</Badge>
                  );
                if (days <= 60)
                  return (
                    <Badge variant="muted">{t("console.workforce.training.daysShort", { days }, `${days}d`)}</Badge>
                  );
                return <span className={MONO_CELL_CLASS}>{formatDate(r.expires_on, "medium")}</span>;
              },
              accessor: (r) => r.expires_on ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
