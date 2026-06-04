import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import { timeAgo, toTitle } from "@/lib/format";
import { awardToInvite, inviteVendor, removeInvite, transitionBroadcast } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  open: "info",
  closed: "muted",
  awarded: "success",
  cancelled: "error",
};

const INVITE_TONE: Record<string, "muted" | "info" | "success" | "error"> = {
  invited: "muted",
  viewed: "info",
  accepted: "success",
  declined: "error",
};

type Broadcast = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  budget_cents: number | null;
  needed_by: string | null;
  awarded_to_vendor_id: string | null;
  awarded_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
  awarded_to: { name: string | null } | null;
};

type Invite = {
  id: string;
  status: string;
  responded_at: string | null;
  notes: string | null;
  vendor_id: string;
  vendor: { name: string | null; email: string | null } | null;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ broadcastId: string }> }) {
  const { broadcastId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: broadcastData }, { data: invitesData }, { data: vendorsData }] = await Promise.all([
    supabase
      .from("work_order_broadcasts")
      .select(
        "id, code, title, description, category, status, budget_cents, needed_by, awarded_to_vendor_id, awarded_at, created_at, project:project_id(name), awarded_to:awarded_to_vendor_id(name)",
      )
      .eq("id", broadcastId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("work_order_broadcast_invites")
      .select("id, status, responded_at, notes, vendor_id, created_at, vendor:vendor_id(name, email)")
      .eq("broadcast_id", broadcastId)
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(500),
  ]);
  const broadcast = broadcastData as unknown as Broadcast | null;
  if (!broadcast) notFound();

  const invites = (invitesData ?? []) as unknown as Invite[];
  const invitedIds = new Set(invites.map((i) => i.vendor_id));
  const candidateVendors = ((vendorsData ?? []) as Array<{ id: string; name: string }>).filter(
    (v) => !invitedIds.has(v.id),
  );

  const responded = invites.filter((i) => i.responded_at != null).length;
  const accepted = invites.filter((i) => i.status === "accepted").length;
  const editable = broadcast.status === "draft" || broadcast.status === "open";

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.woBroadcasts.detail.eyebrow", undefined, "Procurement · Broadcast")}
        title={`${broadcast.code} — ${broadcast.title}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_TONE[broadcast.status] ?? "muted"}>{toTitle(broadcast.status)}</Badge>
            {broadcast.category && <Badge variant="muted">{broadcast.category}</Badge>}
            {broadcast.project?.name && <Badge variant="muted">{broadcast.project.name}</Badge>}
            {broadcast.needed_by && (
              <span className="font-mono text-xs">
                {t(
                  "console.procurement.woBroadcasts.detail.neededBy",
                  { when: new Date(broadcast.needed_by).toLocaleString() },
                  `needed by ${new Date(broadcast.needed_by).toLocaleString()}`,
                )}
              </span>
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("console.procurement.title", undefined, "Procurement"), href: "/console/procurement" },
          {
            label: t("console.procurement.woBroadcasts.title", undefined, "Broadcasts"),
            href: "/console/procurement/wo-broadcasts",
          },
          { label: broadcast.code },
        ]}
        action={
          <div className="flex items-center gap-2">
            {broadcast.status === "draft" && (
              <form action={transitionBroadcast}>
                <input type="hidden" name="broadcastId" value={broadcastId} />
                <input type="hidden" name="status" value="open" />
                <Button type="submit" size="sm">
                  {t("console.procurement.woBroadcasts.detail.openBroadcast", undefined, "Open Broadcast")}
                </Button>
              </form>
            )}
            {broadcast.status === "open" && (
              <form action={transitionBroadcast}>
                <input type="hidden" name="broadcastId" value={broadcastId} />
                <input type="hidden" name="status" value="closed" />
                <Button type="submit" size="sm" variant="ghost">
                  {t("common.close", undefined, "Close")}
                </Button>
              </form>
            )}
            {(broadcast.status === "draft" || broadcast.status === "open") && (
              <form action={transitionBroadcast}>
                <input type="hidden" name="broadcastId" value={broadcastId} />
                <input type="hidden" name="status" value="cancelled" />
                <Button type="submit" size="sm" variant="ghost">
                  {t("common.cancel", undefined, "Cancel")}
                </Button>
              </form>
            )}
            <Button href="/console/procurement/wo-broadcasts" variant="ghost" size="sm">
              {t("common.back", undefined, "Back")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.woBroadcasts.detail.budget", undefined, "Budget")}
            value={broadcast.budget_cents != null ? formatMoney(broadcast.budget_cents) : "—"}
          />
          <MetricCard
            label={t("console.procurement.woBroadcasts.detail.invited", undefined, "Invited")}
            value={String(invites.length)}
          />
          <MetricCard
            label={t("console.procurement.woBroadcasts.detail.responded", undefined, "Responded")}
            value={`${responded}/${invites.length}`}
            accent={accepted > 0}
          />
        </div>

        {broadcast.description && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">
              {t("console.procurement.woBroadcasts.detail.scope", undefined, "Scope")}
            </h2>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--text-secondary)]">{broadcast.description}</p>
          </section>
        )}

        {broadcast.status === "awarded" && broadcast.awarded_to?.name && (
          <section className="surface p-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">
                {t("console.procurement.woBroadcasts.detail.awarded", undefined, "Awarded")}
              </h2>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {broadcast.awarded_at && timeAgo(broadcast.awarded_at)}
              </span>
            </div>
            <p className="mt-2 text-sm">
              <span className="font-semibold">{broadcast.awarded_to.name}</span>
            </p>
          </section>
        )}

        <section className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.procurement.woBroadcasts.detail.invitees", undefined, "Invitees")}
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {t(
                "console.procurement.woBroadcasts.detail.invitedRespondedCount",
                { invited: invites.length, responded },
                `${invites.length} invited · ${responded} responded`,
              )}
            </span>
          </div>
          {invites.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {t(
                "console.procurement.woBroadcasts.detail.noVendorsInvited",
                undefined,
                "No vendors invited yet. Pick from the dropdown below to ping a vendor.",
              )}
            </p>
          ) : (
            <table className="data-table mt-3 w-full">
              <thead>
                <tr>
                  <th className="text-start">
                    {t("console.procurement.woBroadcasts.detail.vendor", undefined, "Vendor")}
                  </th>
                  <th className="text-start">
                    {t("console.procurement.woBroadcasts.detail.state", undefined, "State")}
                  </th>
                  <th className="text-start">
                    {t("console.procurement.woBroadcasts.detail.responded", undefined, "Responded")}
                  </th>
                  <th className="text-start">
                    {t("console.procurement.woBroadcasts.detail.notes", undefined, "Notes")}
                  </th>
                  {editable && <th />}
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <div className="text-sm">{i.vendor?.name ?? i.vendor_id.slice(0, 8)}</div>
                      {i.vendor?.email && (
                        <div className="font-mono text-[10px] text-[var(--text-muted)]">{i.vendor.email}</div>
                      )}
                    </td>
                    <td>
                      <Badge variant={INVITE_TONE[i.status] ?? "muted"}>{toTitle(i.status)}</Badge>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-muted)]">
                      {i.responded_at ? timeAgo(i.responded_at) : "—"}
                    </td>
                    <td className="text-xs">{i.notes ?? "—"}</td>
                    {editable && (
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {broadcast.status === "open" && i.status !== "declined" && (
                            <form action={awardToInvite}>
                              <input type="hidden" name="broadcastId" value={broadcastId} />
                              <input type="hidden" name="inviteId" value={i.id} />
                              <Button type="submit" size="sm" variant="secondary">
                                {t("console.procurement.woBroadcasts.detail.award", undefined, "Award")}
                              </Button>
                            </form>
                          )}
                          <form action={removeInvite}>
                            <input type="hidden" name="broadcastId" value={broadcastId} />
                            <input type="hidden" name="inviteId" value={i.id} />
                            <Button type="submit" size="sm" variant="ghost">
                              {t("common.remove", undefined, "Remove")}
                            </Button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {editable && candidateVendors.length > 0 && (
            <form action={inviteVendor} className="surface-inset mt-4 flex flex-wrap gap-2 rounded-md p-3">
              <input type="hidden" name="broadcastId" value={broadcastId} />
              <select name="vendor_id" required defaultValue="" className="input-base min-w-[14rem] flex-1">
                <option value="" disabled>
                  {t("console.procurement.woBroadcasts.detail.addVendorPlaceholder", undefined, "— Add vendor —")}
                </option>
                {candidateVendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm" variant="secondary">
                {t("console.procurement.woBroadcasts.detail.inviteVendor", undefined, "Invite Vendor")}
              </Button>
            </form>
          )}
          {editable && candidateVendors.length === 0 && invites.length > 0 && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {t(
                "console.procurement.woBroadcasts.detail.allVendorsInvited",
                undefined,
                "All org vendors are already on this broadcast.",
              )}
            </p>
          )}
          {!editable && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {t(
                "console.procurement.woBroadcasts.detail.inviteeListLocked",
                undefined,
                "Invitee list is locked once the broadcast is awarded / closed / cancelled.",
              )}
            </p>
          )}
        </section>
      </div>
    </>
  );
}
