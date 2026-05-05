import { notFound } from "next/navigation";
import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { verifyShareToken } from "@/lib/share/tokens";
import { consumeShareLink } from "@/lib/share/links";
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
 *     consume + redirect to the resource.
 *  4. Otherwise, atomically consume the link and dispatch on resource_table.
 *     For resource types whose public renderer isn't wired yet, render an
 *     inline "shared resource" placeholder card.
 *
 * The placeholder posture is intentional — share_links is a primitive; each
 * downstream resource type wires its renderer in its own phase. See
 * docs/research/smartsuite-parity/04-solutions-permissions-collab.md (#10).
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
  const { data, error } = await (
    supabase.from("share_links" as never) as never as {
      select: (cols: string) => {
        eq: (
          col: string,
          val: string,
        ) => {
          maybeSingle: () => Promise<{ data: DbShareLinkLite | null; error: unknown }>;
        };
      };
    }
  )
    .select(
      "id, org_id, resource_table, resource_id, role, passcode_hash, expires_at, max_uses, uses, label, revoked_at",
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

function NotValid({ message }: { message: string }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <div className="surface w-full p-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">Link not valid</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>
      </div>
    </main>
  );
}

function SharedResourceCard({
  table,
  id,
  label,
  role,
}: {
  table: string;
  id: string;
  label: string | null;
  role: "viewer" | "commenter";
}) {
  // Friendly resource-type labels — extend as renderers are wired.
  const PRETTY: Record<string, string> = {
    view_configs: "Saved view",
    proposals: "Proposal",
    guides: "Event guide",
    event_guides: "Event guide",
    dashboards: "Dashboard",
  };
  const pretty = PRETTY[table] ?? "Resource";
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-6 py-16">
      <div className="surface w-full p-6">
        <p className="text-xs tracking-wide text-[var(--text-muted)] uppercase">{pretty}</p>
        <h1 className="mt-1 text-lg font-semibold tracking-tight">{label ?? "Shared with you"}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          This {pretty.toLowerCase()} has been shared with you. The interactive view for this resource type is coming
          soon.
        </p>
        <dl className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
          <div>
            <dt className="inline font-medium">Resource:</dt> <dd className="inline font-mono">{table}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Id:</dt> <dd className="inline font-mono">{id}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Access:</dt> <dd className="inline">{role}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
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
      <SharedResourceCard
        table={consumed.resource.table}
        id={consumed.resource.id}
        label={consumed.link.label}
        role={consumed.link.role}
      />
    );
  }

  // Passcode-protected, post-unlock render. The action already consumed.
  return <SharedResourceCard table={row.resource_table} id={row.resource_id} label={row.label} role={row.role} />;
}
