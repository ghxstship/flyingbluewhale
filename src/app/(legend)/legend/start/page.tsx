import Link from "next/link";
import type { Metadata } from "next";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession, isAdmin, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";
import { DOC_TEMPLATES } from "@/lib/documents/registry";
import { CATALOG_KINDS, CATALOG_KIND_LABEL } from "@/lib/db/catalog-kinds";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import {
  addCatalogItemAction,
  addCostCenterAction,
  addLocationAction,
  addPositionAction,
  createStartOrgAction,
  installBaseKitAction,
  renameCostCenterAction,
  renamePositionAction,
  sendInviteAction,
} from "./actions";
import { BASE_KIT_COST_CENTERS, BASE_KIT_POSITIONS } from "./base-kit";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Start" };

/**
 * LEG3ND /start: the 8-step organization setup sequence (marketing rebuild
 * plan section 10). Organizations are born in LEG3ND on web.
 *
 * There is NO stored wizard state: every step's completion derives from data
 * presence, and each step writes the same tables the Organization Hub
 * manages. Steps are completed in order but can be revisited at any time.
 */
export default async function StartPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Start" />
        <ConfigureSupabase />
      </>
    );
  }

  const session = await requireSession();
  // "Guest" persona = the auto-added demo membership is the user's only org.
  const hasOrg = session.persona !== "guest";
  const admin = isAdmin(session);
  const manager = isManagerPlus(session);

  const supabase = await createClient();

  const [
    { data: org },
    { data: costCenters },
    { data: positions },
    { data: locations, count: locationCount },
    { count: catalogCount },
    { data: invites, count: inviteCount },
    { data: departments },
  ] = hasOrg
    ? await Promise.all([
        supabase.from("orgs").select("name, name_override, slug, logo_url").eq("id", session.orgId).maybeSingle(),
        supabase
          .from("cost_centers")
          .select("id, code, name, active")
          .eq("org_id", session.orgId)
          .order("code", { ascending: true }),
        supabase
          .from("positions")
          .select("id, title, department_code, active")
          .eq("org_id", session.orgId)
          .order("title", { ascending: true })
          .limit(100),
        supabase
          .from("locations")
          .select("id, name, city, country", { count: "exact" })
          .eq("org_id", session.orgId)
          .order("name", { ascending: true })
          .limit(8),
        supabase
          .from("master_catalog_items")
          .select("id", { count: "exact", head: true })
          .eq("org_id", session.orgId)
          .is("deleted_at", null),
        supabase
          .from("invites")
          .select("id, email, role, invite_state", { count: "exact" })
          .eq("org_id", session.orgId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("dim_department").select("code, label").order("code", { ascending: true }),
      ])
    : [
        { data: null },
        { data: [] },
        { data: [] },
        { data: [], count: 0 },
        { count: 0 },
        { data: [], count: 0 },
        { data: [] },
      ];

  const ccList = costCenters ?? [];
  const posList = positions ?? [];
  const locList = locations ?? [];
  const inviteList = invites ?? [];
  const deptList = departments ?? [];

  const orgName = org?.name_override ?? org?.name ?? "";

  const steps: { id: string; title: string; done: boolean; soft?: boolean }[] = [
    { id: "step-1", title: "Identity", done: hasOrg },
    { id: "step-2", title: "Base kit", done: hasOrg && ccList.length > 0 },
    { id: "step-3", title: "Organization", done: hasOrg && posList.length > 0 },
    { id: "step-4", title: "Finance codes", done: hasOrg && ccList.length > 0 },
    { id: "step-5", title: "Locations", done: hasOrg && (locationCount ?? 0) > 0 },
    { id: "step-6", title: "Catalogs", done: hasOrg && (catalogCount ?? 0) > 0 },
    { id: "step-7", title: "Templates", done: false, soft: true },
    { id: "step-8", title: "Crew invites", done: hasOrg && (inviteCount ?? 0) > 0 },
  ];
  const requiredSteps = steps.filter((s) => !s.soft);
  const doneCount = requiredSteps.filter((s) => s.done).length;

  const lockedNote = (
    <p className="text-sm text-[var(--p-text-2)]">Create your organization in step 1 to unlock this step.</p>
  );

  const compvssUrl = urlFor("mobile", "/");

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Start"
        subtitle="Configure your organization once. Every project inherits it."
        breadcrumbs={[{ label: "LEG3ND" }, { label: "Start" }]}
      />
      <div className="page-content space-y-6">
        <nav aria-label="Setup progress" className="surface p-4">
          <p className="ps-id mb-3 text-xs text-[var(--p-text-2)]">
            {doneCount} of {requiredSteps.length} steps complete. Progress reads from your live data, so
            steps can be revisited at any time.
          </p>
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="focus-ring flex items-center justify-between gap-2 rounded-[var(--p-r-md)] border border-[var(--p-border)] px-3 py-2 text-sm hover:bg-[var(--p-surface-2)]"
                >
                  <span className="truncate">
                    <span className="ps-id mr-2 text-xs text-[var(--p-text-2)]">{i + 1}</span>
                    {s.title}
                  </span>
                  <span
                    className={
                      s.done
                        ? "ps-badge ps-badge--ok shrink-0"
                        : s.soft
                          ? "ps-badge ps-badge--neutral shrink-0"
                          : "ps-badge ps-badge--neutral shrink-0"
                    }
                  >
                    {s.done ? "Done" : s.soft ? "Review" : "To do"}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Step 1 · Identity */}
        <section id="step-1" aria-labelledby="step-1-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-1-h">1. Identity</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              Name the organization your productions live in. You become the owner.
            </p>
          </div>
          {hasOrg ? (
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">{orgName}</span>
                {org?.slug ? <span className="ps-id ml-2 text-xs text-[var(--p-text-2)]">{org.slug}</span> : null}
              </p>
              <p className="text-sm text-[var(--p-text-2)]">
                Display name and logo live in Brand Studio.{" "}
                <a href={urlFor("platform", "/settings/branding")} className="underline">
                  Open branding settings
                </a>
              </p>
            </div>
          ) : (
            <FormShell
              action={createStartOrgAction}
              submitLabel="Create organization"
              dirtyGuard={false}
              className="space-y-4"
              aria-label="Create organization"
            >
              <Input
                label="Organization name"
                name="name"
                required
                maxLength={120}
                placeholder="Acme Productions"
                autoComplete="organization"
                hint="You can rename this later from Brand Studio."
              />
            </FormShell>
          )}
        </section>

        {/* Step 2 · Base kit install */}
        <section id="step-2" aria-labelledby="step-2-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-2-h">2. Base kit install</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              Your organization starts with the XPMS 2.5 standard: 10 cost centers and 10 starter
              positions, one per department class. Everything here is editable after install.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-sm">Cost centers</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--p-text-2)]">
                {BASE_KIT_COST_CENTERS.map(([code, name]) => (
                  <li key={code}>
                    <span className="ps-id mr-2 text-xs">{code}</span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm">Starter positions</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--p-text-2)]">
                {BASE_KIT_POSITIONS.map(([title, dept]) => (
                  <li key={title}>
                    <span className="ps-id mr-2 text-xs">{dept}</span>
                    {title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : ccList.length > 0 ? (
            <p className="text-sm">
              Installed: {ccList.length} cost centers, {posList.length} positions. Adjust them in steps 3
              and 4.
            </p>
          ) : admin ? (
            <FormShell
              action={installBaseKitAction}
              submitLabel="Install base kit"
              dirtyGuard={false}
              className="space-y-4"
              aria-label="Install base kit"
            >
              <p className="text-sm text-[var(--p-text-2)]">
                The install is idempotent: rows you already have are never duplicated.
              </p>
            </FormShell>
          ) : (
            <p className="text-sm text-[var(--p-text-2)]">Only an owner or admin can install the base kit.</p>
          )}
        </section>

        {/* Step 3 · Organization */}
        <section id="step-3" aria-labelledby="step-3-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-3-h">3. Organization</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              The position library, classed by XPMS department. The org chart and role assignment read
              from here. Invite your manager band in{" "}
              <a href="#step-8" className="underline">
                step 8
              </a>
              .
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {posList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {posList.map((p) => (
                    <li key={p.id} className="flex items-baseline gap-2">
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{p.department_code ?? "----"}</span>
                      <span>{p.title}</span>
                      {!p.active ? <span className="ps-badge ps-badge--neutral">Inactive</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  Positions land here once the base kit installs in step 2, or add your first one below.
                </p>
              )}
              {manager ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormShell
                    action={addPositionAction}
                    submitLabel="Add position"
                    dirtyGuard={false}
                    className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                    aria-label="Add position"
                  >
                    <Input label="Title" name="title" required maxLength={120} placeholder="Stage Manager" />
                    <div>
                      <label htmlFor="start-position-dept" className="text-xs font-medium text-[var(--p-text-2)]">
                        Department
                      </label>
                      <select id="start-position-dept" name="department_code" className="ps-input mt-1.5 w-full" defaultValue="">
                        <option value="">No department</option>
                        {deptList.map((d) => (
                          <option key={d.code} value={d.code}>
                            {d.code} {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input label="Summary" name="summary" maxLength={500} placeholder="Optional one-line scope" />
                  </FormShell>
                  {posList.length > 0 ? (
                    <FormShell
                      action={renamePositionAction}
                      submitLabel="Rename"
                      dirtyGuard={false}
                      className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                      aria-label="Rename position"
                    >
                      <div>
                        <label htmlFor="start-position-rename-id" className="text-xs font-medium text-[var(--p-text-2)]">
                          Position
                        </label>
                        <select id="start-position-rename-id" name="id" required className="ps-input mt-1.5 w-full">
                          {posList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input label="New title" name="title" required maxLength={120} />
                    </FormShell>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  Only manager and above can edit the position library.
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 4 · Finance codes */}
        <section id="step-4" aria-labelledby="step-4-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-4-h">4. Finance codes</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              GL codes and cost centers on the XPMS department canon, 0000 through 9000. Rename to match
              your books or add codes of your own.
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {ccList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {ccList.map((c) => (
                    <li key={c.id} className="flex items-baseline gap-2">
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{c.code}</span>
                      <span>{c.name}</span>
                      {!c.active ? <span className="ps-badge ps-badge--neutral">Inactive</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  No cost centers yet. Install the base kit in step 2 to seed the 10 XPMS defaults.
                </p>
              )}
              {manager ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {ccList.length > 0 ? (
                    <FormShell
                      action={renameCostCenterAction}
                      submitLabel="Rename"
                      dirtyGuard={false}
                      className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                      aria-label="Rename cost center"
                    >
                      <div>
                        <label htmlFor="start-cc-rename-id" className="text-xs font-medium text-[var(--p-text-2)]">
                          Cost center
                        </label>
                        <select id="start-cc-rename-id" name="id" required className="ps-input mt-1.5 w-full">
                          {ccList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input label="New name" name="name" required maxLength={120} />
                    </FormShell>
                  ) : null}
                  <FormShell
                    action={addCostCenterAction}
                    submitLabel="Add cost center"
                    dirtyGuard={false}
                    className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                    aria-label="Add cost center"
                  >
                    <Input
                      label="Code"
                      name="code"
                      required
                      maxLength={4}
                      placeholder="6500"
                      hint="Four digits. Sub-codes slot between the department thousands."
                    />
                    <Input label="Name" name="name" required maxLength={120} placeholder="Site Utilities" />
                  </FormShell>
                </div>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">Only manager and above can edit finance codes.</p>
              )}
            </>
          )}
        </section>

        {/* Step 5 · Locations */}
        <section id="step-5" aria-labelledby="step-5-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-5-h">5. Locations</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              Your first venue or office. The canonical space registry every schedule and scan zone
              hangs off.
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              {locList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {locList.map((l) => (
                    <li key={l.id}>
                      {l.name}
                      {l.city ? <span className="text-[var(--p-text-2)]"> · {l.city}</span> : null}
                      {l.country ? <span className="text-[var(--p-text-2)]"> · {l.country}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">Your first location lands here.</p>
              )}
              {manager ? (
                <FormShell
                  action={addLocationAction}
                  submitLabel="Add location"
                  dirtyGuard={false}
                  className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                  aria-label="Add location"
                >
                  <Input label="Name" name="name" required maxLength={160} placeholder="Main Warehouse" />
                  <Input label="Address" name="address" maxLength={240} placeholder="Optional street address" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="City" name="city" maxLength={120} />
                    <Input label="Country" name="country" maxLength={120} />
                  </div>
                </FormShell>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">Only manager and above can add locations.</p>
              )}
            </>
          )}
        </section>

        {/* Step 6 · Catalogs */}
        <section id="step-6" aria-labelledby="step-6-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-6-h">6. Catalogs</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              The master catalog: every assignable thing, from credentials to vehicles. Advancing
              assignments always reference a catalog SKU.
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : (
            <>
              <p className="text-sm">
                {(catalogCount ?? 0) === 1 ? "1 catalog item" : `${catalogCount ?? 0} catalog items`} so far.{" "}
                <a href={urlFor("platform", "/settings/catalog")} className="underline">
                  Manage the full catalog in the console
                </a>
              </p>
              {manager ? (
                <FormShell
                  action={addCatalogItemAction}
                  submitLabel="Add item"
                  dirtyGuard={false}
                  className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                  aria-label="Add catalog item"
                >
                  <div>
                    <label htmlFor="start-catalog-kind" className="text-xs font-medium text-[var(--p-text-2)]">
                      Kind
                    </label>
                    <select id="start-catalog-kind" name="kind" required className="ps-input mt-1.5 w-full" defaultValue="credential">
                      {CATALOG_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {CATALOG_KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Code"
                    name="code"
                    required
                    maxLength={64}
                    placeholder="crew-pass-tier1"
                    hint="Short identifier. Lowercase, dashes ok."
                  />
                  <Input label="Name" name="name" required maxLength={200} placeholder="Crew Pass (Tier 1)" />
                </FormShell>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">
                  Only manager and above can edit the master catalog.
                </p>
              )}
            </>
          )}
        </section>

        {/* Step 7 · Templates (review step) */}
        <section id="step-7" aria-labelledby="step-7-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-7-h">7. Templates</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              A review step, nothing to install: {DOC_TEMPLATES.length} document templates ship ready to
              use, from proposals to run of shows. They pick up your branding automatically.
            </p>
          </div>
          <p className="text-sm">
            <a href={urlFor("platform", "/documents")} className="underline">
              Browse the document library in the console
            </a>
          </p>
        </section>

        {/* Step 8 · Crew invites */}
        <section id="step-8" aria-labelledby="step-8-h" className="surface space-y-4 p-6">
          <div>
            <h2 id="step-8-h">8. Crew invites</h2>
            <p className="mt-1 text-sm text-[var(--p-text-2)]">
              Bring in your team. Each invite emails an acceptance link that expires in 7 days.
            </p>
          </div>
          {!hasOrg ? (
            lockedNote
          ) : admin ? (
            <>
              {inviteList.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {inviteList.map((i) => (
                    <li key={i.id} className="flex items-baseline gap-2">
                      <span>{i.email}</span>
                      <span className="ps-id text-xs text-[var(--p-text-2)]">{i.role}</span>
                      <span className="ps-badge ps-badge--neutral">{i.invite_state}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--p-text-2)]">No invites sent yet.</p>
              )}
              <FormShell
                action={sendInviteAction}
                submitLabel="Send invite"
                dirtyGuard={false}
                className="space-y-4 rounded-[var(--p-r-md)] border border-[var(--p-border)] p-4"
                aria-label="Send invite"
              >
                <Input label="Email" name="email" type="email" required placeholder="crew@example.com" />
                <div>
                  <label htmlFor="start-invite-role" className="text-xs font-medium text-[var(--p-text-2)]">
                    Role
                  </label>
                  <select id="start-invite-role" name="role" required className="ps-input mt-1.5 w-full" defaultValue="member">
                    {PLATFORM_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </FormShell>
              <p className="text-sm text-[var(--p-text-2)]">
                Crew work from COMPVSS, the field app. Once they accept, they sign in at{" "}
                <a href={compvssUrl} className="underline">
                  {compvssUrl}
                </a>{" "}
                and can install it to their home screen.
              </p>
              <p className="text-sm text-[var(--p-text-2)]">
                Project scoping, personas, and module-scoped seats live in the{" "}
                <a href={urlFor("platform", "/people/invites")} className="underline">
                  console invite manager
                </a>
                .
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--p-text-2)]">Only owners and admins can send invites.</p>
          )}
        </section>

        <div className="surface p-6">
          <h2>Where to next</h2>
          <p className="mt-1 text-sm text-[var(--p-text-2)]">
            The <Link href="/legend/hub" className="underline">Organization Hub</Link> is the permanent
            home for everything you just configured. The operator console picks all of it up
            immediately.
          </p>
        </div>
      </div>
    </>
  );
}
