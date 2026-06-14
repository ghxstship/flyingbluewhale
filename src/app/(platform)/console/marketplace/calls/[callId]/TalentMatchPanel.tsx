import "server-only";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";
import { runAI } from "@/lib/ai/run";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";

const matchSchema = z.object({
  matches: z.array(
    z.object({
      talent_id: z.string(),
      score: z.number(),
      reason: z.string(),
    }),
  ),
});

type TalentProfileRow = {
  id: string;
  act_name: string;
  bio: string | null;
  genre_tags: string[] | null;
  tagline: string | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
};

type CallSummary = {
  title: string;
  kind: string;
  description: string | null;
  genre_tags: string[];
  trade_categories: string[];
  region: string | null;
};

/**
 * AI-powered talent matching panel for open call detail pages.
 * Renders top 5 matched talent profiles from the org roster using Claude.
 * Wrap in <Suspense> — this component does a live AI call on render.
 * Competitive parity: Bizzabo Bizzy AI matchmaking + Casting Networks Talent Scout.
 */
export async function TalentMatchPanel({ call }: { call: CallSummary }) {
  if (!env.ANTHROPIC_API_KEY) return null;

  const session = await requireSession();
  const supabase = await createClient();

  const { data: rawProfiles } = await supabase
    .from("talent_profiles")
    .select("id, act_name, bio, genre_tags, tagline, fee_min_cents, fee_max_cents")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .limit(40);

  const profiles = (rawProfiles ?? []) as TalentProfileRow[];
  if (!profiles.length) return null;

  const callDesc = [
    `Title: ${call.title}`,
    `Kind: ${call.kind}`,
    call.description ? `Description: ${call.description.slice(0, 300)}` : null,
    call.genre_tags.length ? `Genres wanted: ${call.genre_tags.join(", ")}` : null,
    call.trade_categories.length ? `Trades/roles: ${call.trade_categories.join(", ")}` : null,
    call.region ? `Region: ${call.region}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const talentList = profiles.map((p) => ({
    id: p.id,
    name: p.act_name,
    genres: (p.genre_tags ?? []).join(", "),
    bio: (p.bio ?? p.tagline ?? "").slice(0, 180),
  }));

  let matches: { talent_id: string; score: number; reason: string }[] = [];
  try {
    const result = await runAI({
      prompt: `You are a talent booking assistant for live events. Match talent from the roster to this open call. Only return profiles with a fit score ≥ 55. Be concise — one sentence per reason.

OPEN CALL:
${callDesc}

TALENT ROSTER:
${JSON.stringify(talentList, null, 2)}

Return the top 5 ranked by fit score (0–100 integer).`,
      outputSchema: matchSchema,
      model: "claude-sonnet-4-6",
      maxTokens: 700,
      temperature: 0.2,
      system: "Return only valid JSON matching the output schema. Scores must be integers 0–100.",
    });
    matches = result.output.matches.slice(0, 5);
  } catch {
    return null;
  }

  const byId = new Map(profiles.map((p) => [p.id, p]));

  return (
    <section className="surface p-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="flex-1 text-sm font-semibold tracking-wide uppercase">AI Suggested Matches</h2>
        <Badge variant="info">Claude AI</Badge>
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-[var(--p-text-2)]">
          No strong matches found in the current talent roster for this call.
        </p>
      ) : (
        <ol className="divide-y divide-[var(--p-border)]">
          {matches.map((m, i) => {
            const p = byId.get(m.talent_id);
            if (!p) return null;
            return (
              <li key={m.talent_id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--p-accent-subtle)] text-[10px] font-bold text-[var(--p-accent)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.act_name}</span>
                    <Badge variant="muted">{m.score}/100</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{m.reason}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function TalentMatchSkeleton() {
  return (
    <section className="surface p-5" aria-busy="true">
      <div className="mb-3 flex items-center gap-2">
        <div className="ps-skel h-4 w-40" />
        <div className="ps-skel h-5 w-16 rounded-full" />
      </div>
      <div className="divide-y divide-[var(--p-border)]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <div className="ps-skel h-5 w-5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="ps-skel h-4 w-36" />
              <div className="ps-skel h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
