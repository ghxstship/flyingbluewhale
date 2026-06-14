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
  SIGNAGE_CATEGORY_LABELS,
  SIGNAGE_STANDARD_LABELS,
  type SignageSign,
} from "@/lib/legend_signage";
import { PictogramPreview } from "./PictogramPreview";

export const dynamic = "force-dynamic";

export default async function SignageLibraryPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Signage Library" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("signage_signs")
    .select("*")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const signs = (data ?? []) as SignageSign[];

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="Signage Library"
        subtitle={
          signs.length === 1 ? "1 sign" : `${signs.length} signs`
        }
        action={<Button href="/console/legend/signage/new">+ New Sign</Button>}
      />
      <div className="page-content">
        {signs.length === 0 ? (
          <EmptyState
            title="No signs yet"
            description="Build your life-safety and wayfinding catalog on ISO 7010, DOT-AIGA, and ISA pictograms."
            action={<Button href="/console/legend/signage/new">+ New Sign</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {signs.map((sign) => (
              <a
                key={sign.id}
                href={`/console/legend/signage/${sign.id}`}
                className="surface hover-lift flex flex-col gap-3 rounded-lg p-4"
                style={sign.colorway ? { color: colorwayTint(sign.colorway) } : undefined}
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
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Map a human colorway label to a theme token so the pictogram glyph
 * (which paints with currentColor) reads in the right safety hue while
 * staying within the token system — no raw hex. Falls back to the
 * default text token.
 */
function colorwayTint(colorway: string): string {
  const c = colorway.toLowerCase();
  if (c.includes("green")) return "var(--p-success, var(--p-text-1))";
  if (c.includes("red")) return "var(--p-danger, var(--p-text-1))";
  if (c.includes("yellow") || c.includes("amber")) return "var(--p-warning, var(--p-text-1))";
  if (c.includes("blue")) return "var(--p-info, var(--p-text-1))";
  return "var(--p-text-1)";
}
