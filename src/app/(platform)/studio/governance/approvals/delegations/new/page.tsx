import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { DELEGATION_SCOPES, DELEGATION_SCOPE_LABEL } from "@/lib/approvals/queries";
import { createDelegation } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.delegations.new.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    // The joined USER must be live too: an archived user's membership row can
    // linger, which listed them as a delegatee option that the action then
    // rightly refused ("not a member") — the option should never render.
    // Found by the 2026-07-17 prod e2e picking exactly such a residue row.
    .is("users.deleted_at", null);

  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.delegations.new.eyebrow", undefined, "Governance")}
        title={t("console.governance.approvals.delegations.new.title", undefined, "New Delegation")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createDelegation}
          cancelHref="/studio/governance/approvals/delegations"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.governance.approvals.delegations.new.delegateeLabel", undefined, "Delegatee")}
            </label>
            <select name="delegatee_user_id" required className="ps-input mt-1.5 w-full" defaultValue="">
              <option value="" disabled>
                {t("console.governance.approvals.delegations.new.delegateePlaceholder", undefined, "Select a member…")}
              </option>
              {memberList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "console.governance.approvals.delegations.new.delegateeHint",
                undefined,
                "The member who will hold your approval authority for this scope.",
              )}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.governance.approvals.delegations.new.scopeLabel", undefined, "Scope")}
            </label>
            <select name="scope" required className="ps-input mt-1.5 w-full" defaultValue="all">
              {DELEGATION_SCOPES.map((s) => (
                <option key={s} value={s}>
                  {t(`console.governance.approvals.scope.${s}`, undefined, DELEGATION_SCOPE_LABEL[s])}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.governance.approvals.delegations.new.scopeRefLabel", undefined, "Scope reference")}
            name="scope_ref"
            maxLength={200}
            hint={t(
              "console.governance.approvals.delegations.new.scopeRefHint",
              undefined,
              "Optional. Policy id, project id, or subject kind the scope targets.",
            )}
          />
          <Input
            label={t("console.governance.approvals.delegations.new.startsLabel", undefined, "Starts at")}
            name="starts_at"
            type="date"
            hint={t("console.governance.approvals.delegations.new.startsHint", undefined, "Optional. Defaults to now.")}
          />
          <Input
            label={t("console.governance.approvals.delegations.new.endsLabel", undefined, "Ends at")}
            name="ends_at"
            type="date"
            hint={t(
              "console.governance.approvals.delegations.new.endsHint",
              undefined,
              "Optional. Open-ended if blank.",
            )}
          />
        </FormShell>
      </div>
    </>
  );
}
