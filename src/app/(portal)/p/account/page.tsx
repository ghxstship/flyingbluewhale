import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { listProviderConnections, listLinkedPasses, type LinkedPassRow } from "@/lib/gvteway";

export const dynamic = "force-dynamic";

/**
 * GVTEWAY · Account — connected ticketing + linked passes (read-only)
 * (design_handoff §2). `provider_connection` drives the connect state per
 * provider; `linked_pass` is a read-only mirror (the provider owns the ticket of
 * record). Session required.
 */
const PROVIDERS = [
  { id: "dice", label: "DICE" },
  { id: "ra", label: "RA" },
  { id: "axs", label: "AXS" },
  { id: "ticketmaster", label: "Ticketmaster" },
  { id: "eventbrite", label: "Eventbrite" },
] as const;

const SYNC_VARIANT: Record<string, "success" | "warning" | "error" | "muted"> = {
  connected: "success",
  syncing: "warning",
  reconnect: "warning",
  error: "error",
  disconnected: "muted",
};

function PassRow({ pass }: { pass: LinkedPassRow }) {
  return (
    <li className="surface flex items-center justify-between gap-3 rounded-[var(--p-r-md)] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--p-text-1)]">{pass.eventName}</p>
        <p className="truncate text-xs text-[var(--p-text-3)]">
          {[pass.venueName, pass.tier, pass.seat].filter(Boolean).join(" · ") || "Pass"}
        </p>
      </div>
      <Badge variant={pass.passState === "owned" ? "success" : "muted"}>{pass.passState}</Badge>
    </li>
  );
}

export default async function AccountPage() {
  const session = hasSupabase ? await getSession() : null;

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
        <header className="space-y-2">
          <p className="eyebrow eyebrow-accent">GVTEWAY</p>
          <h1>Account</h1>
        </header>
        <EmptyState
          title="Sign in to manage your account"
          description="Connect ticketing providers, mirror your passes read-only, and tune your taste."
          action={
            <Link href="/login?next=/p/account" className="font-medium text-[var(--p-accent-text)] hover:underline">
              Sign in
            </Link>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();
  const [connections, passes] = await Promise.all([
    listProviderConnections(supabase, session.userId),
    listLinkedPasses(supabase, session.userId),
  ]);
  const byProvider = new Map(connections.map((c) => [c.provider, c]));

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-8">
      <header className="space-y-2">
        <p className="eyebrow eyebrow-accent">GVTEWAY</p>
        <h1>Account</h1>
      </header>

      <section className="space-y-3">
        <h2 className="eyebrow">Connected ticketing</h2>
        <p className="text-sm text-[var(--p-text-3)]">
          Connect a provider to mirror your passes (read-only) and surface friends&apos; activity.
        </p>
        <ul className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => {
            const conn = byProvider.get(p.id);
            return (
              <li key={p.id}>
                <Badge variant={conn ? SYNC_VARIANT[conn.syncState] ?? "muted" : "muted"}>
                  {p.label} · {conn ? conn.syncState : "not connected"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="eyebrow">Linked passes</h2>
        {passes.length === 0 ? (
          <EmptyState
            title="No linked passes"
            description="Passes from your connected providers appear here, ready to add to your OS wallet or transfer out. GVTEWAY never holds your primary ticket of record."
          />
        ) : (
          <ul className="space-y-2">
            {passes.map((p) => (
              <PassRow key={p.id} pass={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
