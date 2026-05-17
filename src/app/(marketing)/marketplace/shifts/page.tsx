import type { Metadata } from "next";
import { MarketingHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Open Shifts — ATLVS Marketplace",
  description: "Browse and apply to open crew shifts posted by event production companies.",
};

export const dynamic = "force-dynamic";

type Shift = {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  required_skills: string[];
  starts_at: string;
  ends_at: string;
  rate_cents: number | null;
  rate_currency: string;
  slots_total: number;
  slots_filled: number;
  public_slug: string | null;
  org_name: string;
};

export default async function PublicOpenShiftsPage() {
  const fmt = await getRequestFormatters();
  let shifts: Shift[] = [];

  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_open_shifts" as "open_shifts")
      .select("id, title, description, role, required_skills, starts_at, ends_at, rate_cents, rate_currency, slots_total, slots_filled, public_slug, org_name")
      .order("starts_at")
      .limit(100);
    shifts = (data ?? []) as Shift[];
  }

  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Marketplace</p>
          <h1 className="mt-1 text-3xl font-bold">Open Shifts</h1>
          <p className="mt-2 text-[var(--text-muted)]">
            Browse open crew slots from live events production companies. Apply directly — no recruiter needed.
          </p>
        </div>

        {shifts.length === 0 ? (
          <EmptyState
            title="No open shifts right now"
            description="Check back soon — production companies post new crew slots regularly."
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">{shifts.length} open {shifts.length === 1 ? "shift" : "shifts"}</p>
            <ul className="space-y-4">
              {shifts.map((s) => {
                const slotsLeft = s.slots_total - s.slots_filled;
                return (
                  <li key={s.id} className="surface rounded-2xl p-5 hover-lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-lg leading-tight">{s.title}</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">
                          {s.org_name}{s.role ? ` · ${s.role}` : ""}
                        </p>
                      </div>
                      <Badge variant={slotsLeft === 0 ? "muted" : "success"}>
                        {slotsLeft === 0 ? "Filled" : `${slotsLeft} slot${slotsLeft > 1 ? "s" : ""} open`}
                      </Badge>
                    </div>

                    {s.description && (
                      <p className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2">{s.description}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
                      <span>📅 {fmt.date(s.starts_at)}</span>
                      <span>🕐 {fmt.time(s.starts_at)} – {fmt.time(s.ends_at)}</span>
                      {s.rate_cents && (
                        <span>
                          💵 {(s.rate_cents / 100).toLocaleString("en-US", { style: "currency", currency: s.rate_currency })}
                        </span>
                      )}
                    </div>

                    {s.required_skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.required_skills.map((sk) => (
                          <span key={sk} className="px-2 py-0.5 rounded-full bg-[var(--surface-raised)] text-xs font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <Link
                        href="/login?return=/marketplace/shifts"
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-[var(--org-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        Apply — sign in to continue
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
