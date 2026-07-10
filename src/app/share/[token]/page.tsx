import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { verifyShareToken } from "@/lib/share/tokens";
import { consumeShareLink } from "@/lib/share/links";
import { urlFor } from "@/lib/urls";
import { BRAND } from "@/lib/brand";
import { resolveBrandContext, brandContextToCssVars } from "@/lib/branding";
import { ProposalBlockRenderer } from "@/components/proposals/ProposalBlockRenderer";
import { GuideView } from "@/components/guides/GuideView";
import type { ProposalBlock } from "@/lib/proposals/types";
import type { GuideConfig } from "@/lib/guides/types";
import { PassscodeForm } from "./PassscodeForm";

export const dynamic = "force-dynamic";

/**
 * Public unauthenticated share-link landing page.
 *
 * Flow:
 *  1. HMAC-verify the token. Tampered/expired/forged → 404.
 *  2. Look up the row via the service-role client (the visitor has no
 *     Supabase session; the HMAC sig already authorizes the read).
 *  3. If the row carries a passcode_hash AND the visitor hasn't unlocked
 *     this navigation, render <PassscodeForm>. The form's action does the
 *     consume + redirect back here with `?unlocked=1`.
 *  4. Otherwise, atomically consume the link and dispatch on resource_table
 *     to a real read-only renderer:
 *       proposals            → the proposal document (blocks + co-brand)
 *       guides / event_guides → <GuideView> (the Boarding Pass renderer)
 *       view_configs / dashboards / anything else → an honest summary card
 *       (title, type, org brand) with a sign-in CTA for the full view —
 *       those surfaces are interactive console views with no public render
 *       path, so the share is the record's identity, not its pixels.
 */

type DbShareLinkLite = {
  id: string;
  org_id: string;
  resource_table: string;
  resource_id: string;
  role: "viewer" | "commenter";
  passcode_hash: string | null;
  expires_at: string | null;
  max_uses: number | null;
  uses: number;
  label: string | null;
  revoked_at: string | null;
};

async function fetchLinkLite(id: string): Promise<DbShareLinkLite | null> {
  if (!isServiceClientAvailable()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("share_links")
    .select(
      "id, org_id, resource_table, resource_id, role, passcode_hash, expires_at, max_uses, uses, label, revoked_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as DbShareLinkLite;
}

function NotValid({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <div className="surface w-full p-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Link not valid</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">{message}</p>
      </div>
    </main>
  );
}

/** Friendly resource-type labels for the shared-record chrome. */
const PRETTY: Record<string, string> = {
  view_configs: "Saved view",
  proposals: "Proposal",
  guides: "Event guide",
  event_guides: "Event guide",
  dashboards: "Dashboard",
};

/** The "shared by" byline + powered-by footer under every shared render. */
function ShareFooter({ orgName, orgLogoUrl }: { orgName: string; orgLogoUrl?: string | null }) {
  return (
    <footer className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 border-t border-[var(--p-border)] px-6 py-8 text-xs text-[var(--p-text-2)]">
      <div className="flex items-center gap-2">
        {orgLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={orgLogoUrl} alt="" width={18} height={18} aria-hidden="true" />
        ) : null}
        <span className="font-semibold tracking-[0.14em] text-[var(--p-text-1)] uppercase">{orgName}</span>
      </div>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/atlvs-mark.svg" alt="" width={12} height={12} aria-hidden="true" />
        <span className="tracking-[0.14em] uppercase">Powered by {BRAND.mark}</span>
      </div>
    </footer>
  );
}

/**
 * Read-only render of a shared proposal — the same block renderer as the
 * public proposal signing page, minus the signature action (share links
 * are viewer/commenter grants, not signature requests).
 */
async function SharedProposal({ resourceId, orgId }: { resourceId: string; orgId: string }) {
  const svc = createServiceClient();
  const { data: proposal } = await svc
    .from("proposals")
    .select("*")
    .eq("id", resourceId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!proposal) return <NotValid message="The shared proposal no longer exists." />;

  const blocks = (proposal.blocks ?? []) as ProposalBlock[];
  const theme = (proposal.theme as { primary: string; secondary: string }) ?? {
    primary: "#D4782A",
    secondary: "#6D4A2A",
  };

  const [{ data: org }, { data: client }, { data: project }] = await Promise.all([
    svc.from("orgs").select("name, name_override, branding, logo_url").eq("id", proposal.org_id).maybeSingle(),
    proposal.client_id
      ? svc.from("clients").select("name, branding, logo_url").eq("id", proposal.client_id).maybeSingle()
      : Promise.resolve({ data: null }),
    proposal.project_id
      ? svc.from("projects").select("branding").eq("id", proposal.project_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const brand = resolveBrandContext({
    org: org ?? { name: BRAND.legalName, branding: {} },
    client,
    project,
    proposalOverride:
      proposal.branding && Object.keys(proposal.branding as object).length > 0
        ? proposal.branding
        : { accentColor: theme.primary, secondaryColor: theme.secondary },
  });
  const brandVars = brandContextToCssVars(brand) as CSSProperties;

  return (
    <div className="proposal-doc bg-[var(--p-bg)] text-[var(--p-text-1)]" data-theme="light" style={brandVars}>
      <main>
        <ProposalBlockRenderer blocks={blocks} theme={theme} brand={brand} currency={proposal.currency ?? "USD"} />
      </main>
      <ShareFooter orgName={brand.producer.name} orgLogoUrl={brand.producer.logoUrl} />
    </div>
  );
}

/** Read-only render of a shared event guide via the Boarding Pass renderer. */
async function SharedGuide({ resourceId, orgId }: { resourceId: string; orgId: string }) {
  const svc = createServiceClient();
  const [{ data: guide }, { data: org }] = await Promise.all([
    svc
      .from("event_guides")
      .select("id, title, subtitle, classification, config, tier, updated_at")
      .eq("id", resourceId)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    svc.from("orgs").select("name, logo_url").eq("id", orgId).maybeSingle(),
  ]);
  if (!guide) return <NotValid message="The shared guide no longer exists." />;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <GuideView
        title={guide.title}
        subtitle={guide.subtitle}
        classification={guide.classification}
        config={(guide.config ?? {}) as GuideConfig}
        tier={guide.tier}
        updatedAt={guide.updated_at}
      />
      <ShareFooter orgName={org?.name ?? BRAND.legalName} orgLogoUrl={org?.logo_url} />
    </main>
  );
}

/**
 * Honest summary card for resource types with no public render path
 * (saved views and dashboards are interactive console surfaces). States
 * what was shared and by whom, and routes the viewer to sign in for the
 * full interactive view — no placeholder promises.
 */
async function SharedResourceCard({
  table,
  id,
  orgId,
  label,
  role,
}: {
  table: string;
  id: string;
  orgId: string;
  label: string | null;
  role: "viewer" | "commenter";
}) {
  const svc = createServiceClient();

  // Resolve the record's own title where the table carries one.
  let title: string | null = label;
  let description: string | null = null;
  if (table === "view_configs") {
    const { data } = await svc
      .from("view_configs")
      .select("name, description")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    title = data?.name ?? title;
    description = data?.description ?? null;
  } else if (table === "dashboards") {
    const { data } = await svc
      .from("dashboards")
      .select("name, description")
      .eq("id", id)
      .eq("org_id", orgId)
      .maybeSingle();
    title = data?.name ?? title;
    description = data?.description ?? null;
  }
  const { data: org } = await svc.from("orgs").select("name, logo_url").eq("id", orgId).maybeSingle();

  const pretty = PRETTY[table] ?? "Record";
  const orgName = org?.name ?? BRAND.legalName;
  const loginUrl = urlFor("auth", "/login");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <div className="surface w-full p-6">
        <div className="flex items-center gap-2">
          {org?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logo_url} alt="" width={20} height={20} className="rounded" aria-hidden="true" />
          ) : null}
          <p className="text-xs tracking-wide text-[var(--p-text-2)] uppercase">
            {pretty} · {orgName}
          </p>
        </div>
        <h1 className="mt-2 text-lg font-semibold tracking-tight">{title ?? "Shared with you"}</h1>
        {description && <p className="mt-1 text-sm text-[var(--p-text-2)]">{description}</p>}
        <p className="mt-3 text-sm text-[var(--p-text-2)]">
          {orgName} shared this {pretty.toLowerCase()} with you as a {role}. It is an interactive workspace view, so
          the full version lives in the console.
        </p>
        <a href={loginUrl} className="ps-btn ps-btn--cta mt-5 inline-flex">
          Sign in to open it
        </a>
        <p className="mt-4 font-mono text-[11px] text-[var(--p-text-3)]">
          {table} · {id.slice(0, 8)}
        </p>
      </div>
    </main>
  );
}

/** Dispatch a consumed share to the renderer for its resource type. */
function SharedResource({
  table,
  id,
  orgId,
  label,
  role,
}: {
  table: string;
  id: string;
  orgId: string;
  label: string | null;
  role: "viewer" | "commenter";
}) {
  switch (table) {
    case "proposals":
      return <SharedProposal resourceId={id} orgId={orgId} />;
    case "guides":
    case "event_guides":
      return <SharedGuide resourceId={id} orgId={orgId} />;
    default:
      return <SharedResourceCard table={table} id={id} orgId={orgId} label={label} role={role} />;
  }
}

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const unlocked = sp.unlocked === "1";

  const verified = verifyShareToken(token);
  if (!verified) return <NotValid message="The link is malformed or has expired." />;

  const row = await fetchLinkLite(verified.id);
  if (!row) return notFound();

  if (row.revoked_at) return <NotValid message="This link has been revoked." />;
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    return <NotValid message="This link has expired." />;
  }
  if (row.max_uses !== null && row.uses >= row.max_uses) {
    return <NotValid message="This link has reached its use limit." />;
  }

  // Passcode gate. If the row has a passcode and we haven't been redirected
  // back from a successful unlock, show the form.
  if (row.passcode_hash && !unlocked) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
        <div className="w-full">
          <PassscodeForm token={token} label={row.label} />
        </div>
      </main>
    );
  }

  // No-passcode path: atomically claim a use and render. (When `unlocked=1`
  // the consume already happened in the server action — but we don't double-
  // count because the action redirected here with `?unlocked=1` AFTER the
  // claim landed.)
  if (!row.passcode_hash) {
    const consumed = await consumeShareLink({ token });
    if (!consumed.ok) {
      const message =
        consumed.reason === "expired"
          ? "This link has expired."
          : consumed.reason === "revoked"
            ? "This link has been revoked."
            : consumed.reason === "exhausted"
              ? "This link has reached its use limit."
              : "Link not valid.";
      return <NotValid message={message} />;
    }
    return (
      <SharedResource
        table={consumed.resource.table}
        id={consumed.resource.id}
        orgId={consumed.link.org_id}
        label={consumed.link.label}
        role={consumed.link.role}
      />
    );
  }

  // Passcode-protected, post-unlock render. The action already consumed.
  return (
    <SharedResource table={row.resource_table} id={row.resource_id} orgId={row.org_id} label={row.label} role={row.role} />
  );
}
