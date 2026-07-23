import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AtomPicker } from "@/components/xpms/AtomPicker";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CATALOG_KIND_LABEL } from "@/lib/db/assignments";
import { getRequestT } from "@/lib/i18n/request";
import { createAssignmentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ party?: string; catalog?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">{t("console.common.configureSupabase", undefined, "Configure Supabase.")}</div>
    );
  const { projectId } = await params;
  // Prefill (P0.4) — a record-action button elsewhere can deep-link here
  // with ?party=<userId>&catalog=<catalogItemId> to pre-select the assignee
  // and SKU. Values are only used as <select> defaults; the action still
  // validates everything server-side.
  const sp = await searchParams;
  const prefillParty = typeof sp?.party === "string" ? sp.party : "";
  const prefillCatalog = typeof sp?.catalog === "string" ? sp.catalog : "";
  const session = await requireSession();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: members }, { data: atoms }, { data: catalog }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("xpms_atoms")
      .select("id, identifier, name")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .order("identifier", { ascending: true }),
    supabase
      .from("master_catalog_items")
      .select("id, kind, code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .is("deleted_at", null)
      .order("kind", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
  ]);
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
  const atomOptions = (atoms ?? []).map((a) => ({ id: a.id, identifier: a.identifier, name: a.name }));
  const catalogItems = (catalog ?? []) as Array<{
    id: string;
    kind: keyof typeof CATALOG_KIND_LABEL;
    code: string;
    name: string;
  }>;

  return (
    <>
      <ModuleHeader
        eyebrow={(project as { name: string }).name}
        title={t("console.projects.advancing.assignments.new.title", undefined, "New Individual Assignment")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createAssignmentAction.bind(null, projectId)}
          cancelHref={`/studio/projects/${projectId}/advancing/assignments`}
          submitLabel={t("console.projects.advancing.assignments.new.submit", undefined, "Create Assignment")}
        >
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.projects.advancing.assignments.new.catalogItem", undefined, "Catalog Item")}
            </label>
            {catalogItems.length === 0 ? (
              <p className="mt-1.5 text-xs text-[var(--p-text-2)]">
                {t(
                  "console.projects.advancing.assignments.new.noCatalogPrefix",
                  undefined,
                  "No active catalog items in this org. Author one at",
                )}{" "}
                <Link className="underline" href="/studio/settings/catalog">
                  /studio/settings/catalog
                </Link>{" "}
                {t("console.projects.advancing.assignments.new.noCatalogSuffix", undefined, "first.")}
              </p>
            ) : (
              <select name="catalog_item_id" required defaultValue={prefillCatalog} className="ps-input mt-1.5 w-full">
                <option value="">
                  {t(
                    "console.projects.advancing.assignments.new.pickCatalogItem",
                    undefined,
                    "Pick a catalog item",
                  )}
                </option>
                {catalogItems.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{CATALOG_KIND_LABEL[c.kind]}] {c.code} · {c.name}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1 text-[11px] text-[var(--p-text-2)]">
              {t(
                "console.projects.advancing.assignments.new.catalogHint",
                undefined,
                "The catalog row drives kind, pricing, and inventory rollup. Every assignment references a SKU.",
              )}
            </p>
          </div>
          <Input
            label={t("console.projects.advancing.assignments.new.titleLabel", undefined, "Title")}
            name="title"
            required
            maxLength={200}
            placeholder={t(
              "console.projects.advancing.assignments.new.titlePlaceholder",
              undefined,
              "e.g. All-Access Pass · Bay 4 Forklift · Hotel Suite A",
            )}
          />
          <div>
            <label htmlFor="party_user_id" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.projects.advancing.assignments.new.assignee", undefined, "Assignee")}
            </label>
            <select id="party_user_id" name="party_user_id" required defaultValue={prefillParty} className="ps-input mt-1.5 w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t("console.projects.advancing.assignments.new.deadline", undefined, "Deadline")}
            name="deadline"
            type="date"
            hint={t(
              "console.projects.advancing.assignments.new.deadlineHint",
              undefined,
              "When the assignment must be fulfilled by.",
            )}
          />
          <AtomPicker
            name="atom_id"
            atoms={atomOptions}
            hint={t(
              "console.projects.advancing.assignments.new.atomHint",
              undefined,
              "Pin this assignment to a WBS atom so it rolls up on the project Tracker.",
            )}
          />
          <div>
            <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
              {t("console.projects.advancing.assignments.new.notes", undefined, "Notes · Optional")}
            </label>
            <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
