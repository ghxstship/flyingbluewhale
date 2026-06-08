import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { AskPanel } from "./AskPanel";
import type { GuideConfig } from "@/lib/guides/types";

export const dynamic = "force-dynamic";

/** Serialize relevant guide sections to plain text for the AI context window. */
function guideToText(config: GuideConfig): string {
  const lines: string[] = [];
  for (const section of config.sections ?? []) {
    if ("heading" in section) lines.push(`\n## ${section.heading}`);

    if (section.type === "overview") {
      lines.push(section.body);
      for (const c of section.callouts ?? []) {
        lines.push(`[${c.kind.toUpperCase()}] ${c.title ?? ""}: ${c.body}`);
      }
    } else if (section.type === "schedule" || section.type === "timeline") {
      for (const e of section.entries) {
        const loc = "location" in e && e.location ? ` @ ${e.location}` : "";
        const note = e.note ? ` (${e.note})` : "";
        lines.push(`${e.time}: ${"activity" in e ? e.activity : ""}${loc}${note}`);
      }
    } else if (section.type === "contacts") {
      for (const e of section.entries) {
        const parts = [e.role, e.name, e.phone, e.email].filter(Boolean);
        lines.push(parts.join(" — "));
      }
    } else if (section.type === "faq") {
      for (const e of section.entries) {
        lines.push(`Q: ${e.q}\nA: ${e.a}`);
      }
    } else if (section.type === "radio") {
      for (const c of section.channels) {
        lines.push(`${c.channel}: ${c.purpose}`);
      }
      for (const cw of section.codeWords ?? []) {
        lines.push(`Code "${cw.code}" = ${cw.meaning}`);
      }
    } else if (section.type === "sops") {
      for (const e of section.entries) {
        lines.push(`${e.code ? `[${e.code}] ` : ""}${e.title}`);
        e.steps.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
      }
    } else if (section.type === "evacuation") {
      for (const r of section.routes) {
        lines.push(`${r.from} → ${r.to}${r.via ? ` via ${r.via}` : ""}`);
      }
      if (section.assemblyPoint) lines.push(`Assembly point: ${section.assemblyPoint}`);
    }
  }
  return lines.join("\n").trim();
}

export default async function AskPage() {
  let guideContext = "";

  if (hasSupabase) {
    const session = await requireSession();
    const supabase = await createClient();

    // Load the most recent published guide for this user's org (crew persona).
    // Guide context is the AI's knowledge base — truncate to ~12k chars if very large.
    const { data: guide } = await supabase
      .from("event_guides")
      .select("title, config")
      .eq("org_id", session.orgId)
      .eq("published", true)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (guide) {
      const text = guideToText(guide.config as GuideConfig);
      guideContext = `Event: ${guide.title}\n${text}`.slice(0, 12_000);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 44px - 56px)" }}>
      <div className="px-4 pt-4 pb-2 border-b border-[var(--p-border)]">
        <h1 className="text-base font-semibold">Ask the Event Assistant</h1>
        <p className="text-xs text-[var(--p-text-2)] mt-0.5">Powered by Claude · answers sourced from your event guide</p>
      </div>
      <AskPanel guideContext={guideContext} />
    </div>
  );
}
