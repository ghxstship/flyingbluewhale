import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Card, CardBody, CardHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import { XPMS_CLASSES } from "@/lib/xpms";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="XPMS" title={t("console.xpms.classes.title", undefined, "Classes")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.xpms.classes.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase.from("xpms_atoms").select("class_code, state").eq("org_id", session.orgId);
  const counts = new Map<number, { uac: number; tpc: number }>();
  (data ?? []).forEach((a: { class_code: number; state: string }) => {
    const c = counts.get(a.class_code) ?? { uac: 0, tpc: 0 };
    if (a.state === "tpc") c.tpc++;
    else c.uac++;
    counts.set(a.class_code, c);
  });

  return (
    <>
      <ModuleHeader
        eyebrow="XPMS · XTC Protocol™"
        title={t("console.xpms.classes.title", undefined, "Classes")}
        subtitle={t(
          "console.xpms.classes.subtitle",
          undefined,
          "Ten classes — collection and code unified into a single taxonomy.",
        )}
      />
      <div className="page-content grid grid-cols-1 gap-4 md:grid-cols-2">
        {XPMS_CLASSES.map((c) => {
          const ct = counts.get(c.code) ?? { uac: 0, tpc: 0 };
          return (
            <Card key={c.code}>
              <div style={{ height: 4, background: c.accent }} />
              <CardHeader title={`${c.code}000 · ${c.name}`} subtitle={c.oneLine} />
              <CardBody>
                <div className="mb-3 text-xs text-[var(--text-muted)]">{c.domain}</div>
                <div className="flex gap-4 font-mono text-xs">
                  <span>
                    {t("console.xpms.classes.uac", undefined, "UAC")} <strong>{ct.uac}</strong>
                  </span>
                  <span>
                    {t("console.xpms.classes.tpc", undefined, "TPC")} <strong>{ct.tpc}</strong>
                  </span>
                  <span>
                    {t("console.xpms.classes.total", undefined, "Total")} <strong>{ct.uac + ct.tpc}</strong>
                  </span>
                </div>
                <div className="mt-3 text-xs">
                  <Link href={`/console/xpms/codebook#class-${c.code}`} className="text-[var(--org-primary)]">
                    {t("console.xpms.classes.viewCodebookSection", undefined, "View codebook section →")}
                  </Link>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
