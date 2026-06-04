export const dynamic = "force-dynamic";

import { PortalSubpage } from "@/components/PortalSubpage";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toTitle } from "@/lib/format";
import { fmtDate } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("credentials")
    .select("id, kind, number, issued_on, expires_on, file_path")
    .eq("org_id", session.orgId)
    .order("expires_on", { ascending: true, nullsFirst: false });
  const items = (data ?? []) as Array<{
    id: string;
    kind: string;
    number: string | null;
    issued_on: string | null;
    expires_on: string | null;
    file_path: string | null;
  }>;
  const now = Date.now();
  return (
    <PortalSubpage
      slug={slug}
      persona="vendor"
      title={t("p.vendor.credentials.title", undefined, "Credentials")}
      subtitle={t("p.vendor.credentials.subtitle", undefined, "COI, W-9, safety cards")}
    >
      {items.length === 0 ? (
        <EmptyState
          title={t("p.vendor.credentials.empty.title", undefined, "No Credentials on File")}
          description={t(
            "p.vendor.credentials.empty.description",
            undefined,
            "Upload a COI and W-9 before your first invoice. Expired credentials block payouts.",
          )}
        />
      ) : (
        <table className="data-table w-full text-sm">
          <thead>
            <tr>
              <th>{t("p.vendor.credentials.col.kind", undefined, "Kind")}</th>
              <th>{t("p.vendor.credentials.col.number", undefined, "Number")}</th>
              <th>{t("p.vendor.credentials.col.issued", undefined, "Issued")}</th>
              <th>{t("p.vendor.credentials.col.expires", undefined, "Expires")}</th>
              <th>{t("p.vendor.credentials.col.status", undefined, "Status")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const expiresAt = c.expires_on ? new Date(c.expires_on).getTime() : Infinity;
              const state = expiresAt < now ? "expired" : expiresAt - now < 30 * 864e5 ? "expiring" : "active";
              return (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{toTitle(c.kind)}</td>
                  <td className="font-mono text-xs">{c.number ?? "—"}</td>
                  <td className="font-mono text-xs">{fmtDate(c.issued_on)}</td>
                  <td className="font-mono text-xs">{fmtDate(c.expires_on)}</td>
                  <td>
                    <StatusChip tone={state === "expired" ? "danger" : state === "expiring" ? "warning" : "success"}>
                      {state === "expired"
                        ? t("p.vendor.credentials.state.expired", undefined, "expired")
                        : state === "expiring"
                          ? t("p.vendor.credentials.state.expiring", undefined, "expiring")
                          : t("p.vendor.credentials.state.active", undefined, "active")}
                    </StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </PortalSubpage>
  );
}
