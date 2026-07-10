import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import {
  SIGNAGE_CATEGORIES,
  SIGNAGE_CATEGORY_LABELS,
  SIGNAGE_STANDARDS,
  SIGNAGE_STANDARD_LABELS,
  type SignageCategory,
  type SignageSign,
  type SignageStandard,
} from "@/lib/legend_signage";
import { PictogramPreview } from "./PictogramPreview";

export const dynamic = "force-dynamic";

/**
 * /legend/signage — the org's sign register. Server-filtered facets (category
 * + standard chips, URL-backed so views are shareable) and a text search over
 * name/code sit above the grid; cards navigate client-side via `next/link`
 * (audit D-25).
 */
export default async function SignageLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; standard?: string }>;
}) {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Signage Library" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const { q, category, standard } = await searchParams;
  const activeCategory = SIGNAGE_CATEGORIES.includes(category as SignageCategory)
    ? (category as SignageCategory)
    : null;
  const activeStandard = SIGNAGE_STANDARDS.includes(standard as SignageStandard)
    ? (standard as SignageStandard)
    : null;
  const needle = (q ?? "").trim().replace(/[%,()]/g, "");

  const db = (await createClient()) as unknown as LooseSupabase;
  let queryBuilder = db
    .from("signage_signs")
    .select("*")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (activeCategory) queryBuilder = queryBuilder.eq("category", activeCategory);
  if (activeStandard) queryBuilder = queryBuilder.eq("standard", activeStandard);
  if (needle) queryBuilder = queryBuilder.or(`name.ilike.%${needle}%,code.ilike.%${needle}%`);
  const { data } = await queryBuilder.order("created_at", { ascending: false }).limit(200);
  const signs = (data ?? []) as SignageSign[];

  /** Build an href preserving the other active facets. */
  const facetHref = (next: { category?: string | null; standard?: string | null }) => {
    const params = new URLSearchParams();
    if (needle) params.set("q", needle);
    const cat = next.category === undefined ? activeCategory : next.category;
    const std = next.standard === undefined ? activeStandard : next.standard;
    if (cat) params.set("category", cat);
    if (std) params.set("standard", std);
    const qs = params.toString();
    return qs ? `/legend/signage?${qs}` : "/legend/signage";
  };

  const filtered = Boolean(needle || activeCategory || activeStandard);
  const chipClass = (on: boolean) =>
    `inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold transition-colors ${
      on
        ? "border-[var(--p-accent)] bg-[var(--p-accent)]/12 text-[var(--p-accent-text)]"
        : "border-[var(--p-border)] bg-[var(--p-surface)] text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
    }`;

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Signage Library"
        subtitle={signs.length === 1 ? "1 sign" : `${signs.length} signs`}
        action={<Button href="/legend/signage/new">+ New Sign</Button>}
      />
      <div className="page-content space-y-4">
        {/* Search + facet row (D-25). GET form keeps this a zero-JS server surface. */}
        <form method="get" action="/legend/signage" className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={needle}
            placeholder="Search by name or code"
            aria-label="Search signs"
            className="ps-input max-w-xs"
          />
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          {activeStandard && <input type="hidden" name="standard" value={activeStandard} />}
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {filtered && (
            <Link
              href="/legend/signage"
              className="text-xs font-semibold text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
            >
              Clear
            </Link>
          )}
        </form>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by category">
          <span className="eyebrow me-1">Category</span>
          {SIGNAGE_CATEGORIES.map((c) => (
            <Link
              key={c}
              href={facetHref({ category: activeCategory === c ? null : c })}
              className={chipClass(activeCategory === c)}
              aria-current={activeCategory === c ? "true" : undefined}
            >
              {SIGNAGE_CATEGORY_LABELS[c]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by standard">
          <span className="eyebrow me-1">Standard</span>
          {SIGNAGE_STANDARDS.map((s) => (
            <Link
              key={s}
              href={facetHref({ standard: activeStandard === s ? null : s })}
              className={chipClass(activeStandard === s)}
              aria-current={activeStandard === s ? "true" : undefined}
            >
              {SIGNAGE_STANDARD_LABELS[s]}
            </Link>
          ))}
        </div>

        {signs.length === 0 ? (
          filtered ? (
            <EmptyState
              title="No matching signs"
              description="No signs match this search or filter. Clear the filters to see the full register."
              action={
                <Button href="/legend/signage" variant="secondary">
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No signs yet"
              description="Build your life-safety and wayfinding catalog on ISO 7010, DOT-AIGA, and ISA pictograms."
              action={<Button href="/legend/signage/new">+ New Sign</Button>}
            />
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {signs.map((sign) => (
              <Link
                key={sign.id}
                href={`/legend/signage/${sign.id}`}
                className="surface hover-lift flex flex-col gap-3 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <PictogramPreview sign={sign} />
                  <StatusBadge status={sign.sign_state} />
                </div>
                <div className="text-[var(--p-text-1)]">
                  <div className="text-sm font-semibold">{sign.name}</div>
                  <div className="font-mono text-xs text-[var(--p-text-2)]">{sign.code}</div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--p-text-2)]">
                  <span>{SIGNAGE_STANDARD_LABELS[sign.standard]}</span>
                  <span>{SIGNAGE_CATEGORY_LABELS[sign.category]}</span>
                  {sign.colorway && <span>{sign.colorway}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
