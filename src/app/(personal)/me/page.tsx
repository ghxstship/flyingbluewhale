import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function MePage() {
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-display text-3xl">My dashboard</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Configure Supabase to sign in.</p>
      </div>
    );
  }

  const session = await requireSession();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-label text-[var(--color-text-tertiary)]">My dashboard</div>
          <h1 className="mt-1 text-display text-3xl">{session.email}</h1>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn btn-ghost text-xs" type="submit">Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Role</div>
          <div className="mt-2"><Badge variant="info">{session.role}</Badge></div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Tier</div>
          <div className="mt-2"><Badge variant="cyan">{session.tier}</Badge></div>
        </div>
        <div className="card-elevated p-4">
          <div className="text-label text-[var(--color-text-tertiary)]">Organization</div>
          <div className="mt-2 text-mono text-xs">{session.orgId || "None"}</div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/console" className="card p-6">
          <div className="text-label text-[var(--brand-color)]">Open console →</div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Projects, finance, procurement, production, people, AI.</p>
        </Link>
        <Link href="/me/tickets" className="card p-6">
          <div className="text-label text-[var(--brand-color)]">My tickets →</div>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Purchased and scanned tickets.</p>
        </Link>
      </div>
    </div>
  );
}
