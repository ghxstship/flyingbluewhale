import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { WalletView, type CredentialEntry } from "./WalletView";

export const dynamic = "force-dynamic";

/**
 * /m/wallet — the COMPVSS Rose pass + the holder's credential entitlements.
 * Reads the caller's `assignments` (catalog_kind='credential'), enriches each
 * with `credential_assignment_details` (access level + expiry), and seeds the
 * rotating gate token off their first active `assignment_scan_codes` code.
 *
 * The surviving client `WalletView` renders the kit `RoseCard` (props
 * `{compact?, onClick}` only — no passBase) and a `RotatingQR base={passBase}`.
 * Design truth: prototype pass (app.jsx 2496-2526).
 */

export default async function MobileWalletPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.wallet.eyebrow", undefined, "Credential")}</div>
        <h1 className="scr-h">{t("m.wallet.title", undefined, "The COMPVSS Rose")}</h1>
        <p className="form-intro">{t("common.configureSupabase", undefined, "Configure Supabase.")}</p>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, fulfillment_state, catalog_item_id")
    .eq("org_id", session.orgId)
    .eq("party_user_id", session.userId)
    .eq("catalog_kind", "credential")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  type AssignmentRow = {
    id: string;
    title: string | null;
    fulfillment_state: string;
    catalog_item_id: string;
  };
  const rows = (assignments ?? []) as AssignmentRow[];
  const assignmentIds = rows.map((r) => r.id);
  const catalogIds = Array.from(new Set(rows.map((r) => r.catalog_item_id)));

  // Resolve detail siblings + catalog names + an active scan code in parallel.
  const [{ data: details }, { data: catalog }, { data: codes }] = await Promise.all([
    assignmentIds.length
      ? supabase
          .from("credential_assignment_details")
          .select("assignment_id, access_level, expires_on")
          .in("assignment_id", assignmentIds)
      : Promise.resolve({ data: [] as unknown[] }),
    catalogIds.length
      ? supabase.from("master_catalog_items").select("id, name").in("id", catalogIds)
      : Promise.resolve({ data: [] as unknown[] }),
    assignmentIds.length
      ? supabase
          .from("assignment_scan_codes")
          .select("assignment_id, code")
          .in("assignment_id", assignmentIds)
          .eq("active", true)
          .limit(1)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const detailMap = new Map<string, { accessLevel: string | null; expiresOn: string | null }>();
  for (const d of (details ?? []) as Array<{
    assignment_id: string;
    access_level: string | null;
    expires_on: string | null;
  }>) {
    detailMap.set(d.assignment_id, { accessLevel: d.access_level, expiresOn: d.expires_on });
  }
  const catalogMap = new Map<string, string>();
  for (const ci of (catalog ?? []) as Array<{ id: string; name: string }>) {
    catalogMap.set(ci.id, ci.name);
  }
  const activeCode = ((codes ?? []) as Array<{ code: string }>)[0]?.code ?? null;

  const credentials: CredentialEntry[] = rows.map((r) => {
    const d = detailMap.get(r.id);
    return {
      id: r.id,
      title: r.title ?? catalogMap.get(r.catalog_item_id) ?? t("m.wallet.credential", undefined, "Credential"),
      state: r.fulfillment_state,
      accessLevel: d?.accessLevel ?? null,
      expiresOn: d?.expiresOn ?? null,
    };
  });

  const passBase = `COMPVSS:${activeCode ?? session.userId.slice(0, 8).toUpperCase()}`;

  const labels = {
    accessTitle: t("m.wallet.accessTitle", undefined, "Access & Permissions"),
    emptyTitle: t("m.wallet.empty.title", undefined, "No Credentials"),
    emptyBody: t(
      "m.wallet.empty.body",
      undefined,
      "Credential entitlements appear here once issued. Reach out to your admin.",
    ),
    help: t("m.wallet.help", undefined, "Contact Admin For Help"),
  };

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.wallet.eyebrow", undefined, "Active Credential")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.wallet.title", undefined, "The COMPVSS Rose")}
      </h1>
      <WalletView credentials={credentials} passBase={passBase} labels={labels} />
    </div>
  );
}
