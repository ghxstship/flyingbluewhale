import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";

export const dynamic = "force-dynamic";

type AccreditationRow = {
  id: string;
  person_name: string;
  card_barcode: string | null;
  state: "vetting" | "approved" | "issued" | "denied" | "revoked" | string;
  valid_from: string | null;
  valid_to: string | null;
  category: { code: string | null; name: string | null; color: string | null } | null;
  delegation: { name: string | null; code: string | null } | null;
};

export default async function WalletPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, email, avatar_url")
    .eq("id", session.userId)
    .maybeSingle();

  const { data } = await supabase
    .from("accreditations")
    .select(
      "id, person_name, card_barcode, state, valid_from, valid_to, " +
        "category:category_id(code, name, color), " +
        "delegation:delegation_id(name, code)",
    )
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .order("issued_at", { ascending: false })
    .limit(10);
  const cards = (data ?? []) as unknown as AccreditationRow[];

  const issued = cards.filter((c) => c.state === "issued");
  const others = cards.filter((c) => c.state !== "issued");

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">My Credential</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Show this screen at the gate. Keep it active until your shift ends.
      </p>

      {issued.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            size="compact"
            title="No Issued Credential"
            description={
              cards.length === 0
                ? "You don't have an accreditation in this workspace yet. Reach out to your delegation contact."
                : "Your application is in vetting. You'll see the card here once it's approved + issued."
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {issued.map((c) => (
            <li
              key={c.id}
              className="surface p-5"
              style={c.category?.color ? { ["--brand-color" as string]: c.category.color } : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold tracking-[0.2em] text-[var(--brand-color,var(--org-primary))] uppercase">
                    {c.category?.code ?? "ACC"}
                  </div>
                  <div className="mt-1 text-xl leading-snug font-semibold">{c.person_name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">
                    {c.delegation
                      ? c.delegation.code
                        ? `${c.delegation.code} · ${c.delegation.name}`
                        : c.delegation.name
                      : (user?.email ?? "")}
                  </div>
                </div>
                {c.category?.name && <Badge variant="brand">{c.category.name}</Badge>}
              </div>
              {c.card_barcode && (
                <div className="surface-inset mt-4 rounded-md p-4 text-center">
                  <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">Card Barcode</div>
                  <div className="mt-1.5 font-mono text-base tracking-wider">{c.card_barcode}</div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[var(--text-muted)]">Valid From</div>
                  <div className="mt-0.5 font-mono">{c.valid_from?.slice(0, 10) ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)]">Valid To</div>
                  <div className="mt-0.5 font-mono">{c.valid_to?.slice(0, 10) ?? "—"}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">Other Cards</h2>
          <ul className="mt-3 space-y-2">
            {others.map((c) => (
              <li key={c.id} className="surface flex items-center justify-between p-3">
                <div className="text-sm">
                  <div className="font-medium">{c.person_name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{c.category?.code ?? "—"}</div>
                </div>
                <Badge
                  variant={
                    c.state === "approved"
                      ? "success"
                      : c.state === "denied" || c.state === "revoked"
                        ? "error"
                        : "muted"
                  }
                >
                  {c.state}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 border-t border-[var(--border-color)] pt-4">
        <Link href={urlFor("personal", "/me/profile")} className="text-xs text-[var(--org-primary)]">
          Open profile →
        </Link>
      </div>
    </div>
  );
}
