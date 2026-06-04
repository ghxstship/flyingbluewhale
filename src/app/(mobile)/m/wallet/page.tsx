import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
        {t("m.wallet.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
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
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.wallet.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.wallet.title", undefined, "My Credential")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t("m.wallet.subtitle", undefined, "Show this screen at the gate. Keep it active until your shift ends.")}
      </p>

      {issued.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            size="compact"
            title={t("m.wallet.empty.title", undefined, "No Issued Credential")}
            description={
              cards.length === 0
                ? t(
                    "m.wallet.empty.noAccreditation",
                    undefined,
                    "You don't have an accreditation in this workspace yet. Reach out to your delegation contact.",
                  )
                : t(
                    "m.wallet.empty.inVetting",
                    undefined,
                    "Your application is in vetting. You'll see the card here once it's approved + issued.",
                  )
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
                    {c.category?.code ?? t("m.wallet.defaultCategoryCode", undefined, "ACC")}
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
                  <div className="text-xs tracking-wider text-[var(--text-muted)] uppercase">
                    {t("m.wallet.cardBarcode", undefined, "Card Barcode")}
                  </div>
                  <div className="mt-1.5 font-mono text-base tracking-wider">{c.card_barcode}</div>
                </div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[var(--text-muted)]">{t("m.wallet.validFrom", undefined, "Valid From")}</div>
                  <div className="mt-0.5 font-mono">{c.valid_from?.slice(0, 10) ?? "—"}</div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)]">{t("m.wallet.validTo", undefined, "Valid To")}</div>
                  <div className="mt-0.5 font-mono">{c.valid_to?.slice(0, 10) ?? "—"}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            {t("m.wallet.otherCards", undefined, "Other Cards")}
          </h2>
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
                  {t(`m.wallet.state.${c.state}`, undefined, c.state)}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 border-t border-[var(--border-color)] pt-4">
        <Link href="/me/profile" className="text-xs text-[var(--org-primary)]">
          {t("m.wallet.openProfile", undefined, "Open profile →")}
        </Link>
      </div>
    </div>
  );
}
