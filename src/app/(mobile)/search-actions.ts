"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * COMPVSS global search — backs the app bar's search drawer (kit 28).
 *
 * A server action rather than an API route: this has exactly one caller, it
 * needs the session's org scope, and adding a public `/api/v1/search` surface
 * would mean an OpenAPI entry, a scope, and a contract for something the field
 * app talks to directly.
 *
 * Groups mirror the kit's: Tasks · Assets · Calendar · Jobs.
 */
const Input = z.object({ q: z.string().trim().min(1).max(120) });

export type SearchHit = { icon: string; title: string; sub: string; href: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

const LIMIT = 6;

export async function searchMobile(qRaw: string): Promise<{ groups: SearchGroup[] }> {
  const session = await requireSession();
  const parsed = Input.safeParse({ q: qRaw });
  if (!parsed.success || !hasSupabase) return { groups: [] };
  const q = parsed.data.q;
  const like = `%${q}%`;
  const supabase = await createClient();

  const [tasks, assets, events, jobs] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, task_state")
      .eq("org_id", session.orgId)
      .ilike("title", like)
      .limit(LIMIT),
    // "Assets" here means the caller's OWN assigned gear — the Assets tab's
    // meaning — not the org's stock on hand.
    supabase
      .from("assignments")
      .select("id, title, catalog_kind")
      .eq("org_id", session.orgId)
      .eq("party_user_id", session.userId)
      .is("deleted_at", null)
      .ilike("title", like)
      .limit(LIMIT),
    supabase
      .from("events")
      .select("id, name, starts_at")
      .eq("org_id", session.orgId)
      .ilike("name", like)
      .limit(LIMIT),
    supabase
      .from("job_postings")
      .select("id, title, employment_type")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .ilike("title", like)
      .limit(LIMIT),
  ]);

  const groups: SearchGroup[] = [
    {
      label: "Tasks",
      hits: (tasks.data ?? []).map((t) => ({
        icon: "ListChecks",
        title: t.title,
        sub: String(t.task_state ?? "Task"),
        href: `/m/tasks/${t.id}`,
      })),
    },
    {
      label: "Assets",
      hits: (assets.data ?? []).map((a) => ({
        icon: "Package",
        title: a.title ?? String(a.catalog_kind ?? "Asset"),
        sub: String(a.catalog_kind ?? ""),
        href: `/m/advances/${a.id}`,
      })),
    },
    {
      label: "Calendar",
      hits: (events.data ?? []).map((e) => ({
        icon: "CalendarDays",
        title: e.name,
        sub: e.starts_at ? new Date(e.starts_at).toISOString().slice(0, 10) : "Event",
        href: "/m/schedule",
      })),
    },
    {
      label: "Jobs",
      hits: (jobs.data ?? []).map((j) => ({
        icon: "Briefcase",
        title: j.title,
        sub: String(j.employment_type ?? "Job"),
        href: "/m/jobs",
      })),
    },
  ].filter((g) => g.hits.length > 0);

  return { groups };
}
