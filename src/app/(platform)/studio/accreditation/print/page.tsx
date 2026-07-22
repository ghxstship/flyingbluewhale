import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.accreditation.print.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.accreditation.print.title", undefined, "Print Queue")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accreditation.print.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accreditations", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
    filters: [{ column: "state", op: "eq", value: "approved" }],
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accreditation.print.eyebrow", undefined, "Accreditation")}
        title={t("console.accreditation.print.title", undefined, "Print Queue")}
        subtitle={
          rows.length === 1
            ? t(
                "console.accreditation.print.subtitleOne",
                { count: rows.length },
                `${rows.length} Approved Badge Pending Print`,
              )
            : t(
                "console.accreditation.print.subtitleOther",
                { count: rows.length },
                `${rows.length} Approved Badges Pending Print`,
              )
        }
        action={
          rows.length > 0 ? (
            <Button href="/studio/accreditation/print/sheet" size="sm">
              {t("console.accreditation.print.printSheet", undefined, "Print sheet")}
            </Button>
          ) : null
        }
      />
      <div className="page-content">
        <DataView
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          emptyLabel={t("console.accreditation.print.emptyLabel", undefined, "No badges queued")}
          emptyDescription={t(
            "console.accreditation.print.emptyDescription",
            undefined,
            "Approve accreditations under /studio/accreditation. Approved cards appear here ready for batch print.",
          )}
          columns={[
            {
              key: "person_name",
              header: t("console.accreditation.print.columns.person", undefined, "Person"),
              render: (r) => String(r.person_name ?? "—"),
              accessor: (r) => r.person_name ?? null,
            },
            {
              key: "card_barcode",
              header: t("console.accreditation.print.columns.barcode", undefined, "Barcode"),
              render: (r) => String(r.card_barcode ?? "—"),
              mono: true,
              accessor: (r) => r.card_barcode ?? null,
            },
            {
              key: "state",
              header: t("console.accreditation.print.columns.state", undefined, "State"),
              render: (r) => String(r.state ?? "—"),
              accessor: (r) => r.state ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
