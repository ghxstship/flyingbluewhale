"use server";

import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

/**
 * COMPVSS global search — backs the /m/search surface (kit 29 — the
 * Conformance Spec ratified Global Search as a first-class route, reached
 * from the top bar; supersedes the kit-28 overlay drawer).
 *
 * A server action rather than an API route: this has exactly one caller, it
 * needs the session's org scope, and adding a public `/api/v1/search` surface
 * would mean an OpenAPI entry, a scope, and a contract for something the field
 * app talks to directly.
 *
 * App-wide groups per the spec: Tasks · People · Assets · Docs · Templates ·
 * Spaces (+ Calendar · Jobs, kept from kit 28). `scope` narrows to one
 * group — the spec's scoped filters. Kit 32 C2 added the Templates span.
 */
const Input = z.object({
  q: z.string().trim().min(1).max(120),
  scope: z.enum(["all", "tasks", "people", "assets", "docs", "templates", "spaces"]).default("all"),
});

export type SearchScope = "all" | "tasks" | "people" | "assets" | "docs" | "templates" | "spaces";
export type SearchHit = { icon: string; title: string; sub: string; href: string };
export type SearchGroup = { label: string; hits: SearchHit[] };

const LIMIT = 6;

export async function searchMobile(qRaw: string, scopeRaw: SearchScope = "all"): Promise<{ groups: SearchGroup[] }> {
  const session = await requireSession();
  const parsed = Input.safeParse({ q: qRaw, scope: scopeRaw });
  if (!parsed.success || !hasSupabase) return { groups: [] };
  const { q, scope } = parsed.data;
  const like = `%${q}%`;
  const supabase = await createClient();
  const want = (s: Exclude<SearchScope, "all">) => scope === "all" || scope === s;
  const none = Promise.resolve({ data: null });

  const [tasks, people, assets, docs, templates, spaces, events, jobs] = await Promise.all([
    want("tasks")
      ? supabase
          .from("tasks")
          .select("id, title, task_state")
          .eq("org_id", session.orgId)
          .ilike("title", like)
          .limit(LIMIT)
      : none,
    want("people")
      ? supabase
          .from("crew_members")
          .select("id, name, role")
          .eq("org_id", session.orgId)
          .ilike("name", like)
          .limit(LIMIT)
      : none,
    // "Assets" here means the caller's OWN assigned gear — the Assets tab's
    // meaning — not the org's stock on hand.
    want("assets")
      ? supabase
          .from("assignments")
          .select("id, title, catalog_kind")
          .eq("org_id", session.orgId)
          .eq("party_user_id", session.userId)
          .is("deleted_at", null)
          .ilike("title", like)
          .limit(LIMIT)
      : none,
    // Docs = the Knowledge surface (published SOPs & policies).
    want("docs")
      ? supabase
          .from("sops")
          .select("id, title, category")
          .eq("org_id", session.orgId)
          .eq("sop_state", "published")
          .is("deleted_at", null)
          .ilike("title", like)
          .limit(LIMIT)
      : none,
    // Templates = the org + project template library (`field_templates`).
    want("templates")
      ? supabase
          .from("field_templates")
          .select("id, name, category")
          .eq("org_id", session.orgId)
          .is("deleted_at", null)
          .ilike("name", like)
          .limit(LIMIT)
      : none,
    want("spaces")
      ? supabase
          .from("chat_rooms")
          .select("id, name, space_kind")
          .eq("org_id", session.orgId)
          .eq("room_kind", "space")
          .is("deleted_at", null)
          .ilike("name", like)
          .limit(LIMIT)
      : none,
    scope === "all"
      ? supabase
          .from("events")
          .select("id, name, starts_at")
          .eq("org_id", session.orgId)
          .ilike("name", like)
          .limit(LIMIT)
      : none,
    scope === "all"
      ? supabase
          .from("job_postings")
          .select("id, title, employment_type")
          .eq("org_id", session.orgId)
          .is("deleted_at", null)
          .ilike("title", like)
          .limit(LIMIT)
      : none,
  ]);

  const groups: SearchGroup[] = [
    {
      label: "Tasks",
      hits: ((tasks.data ?? []) as Array<{ id: string; title: string; task_state: string | null }>).map((t) => ({
        icon: "ListChecks",
        title: t.title,
        sub: String(t.task_state ?? "Task"),
        href: `/m/tasks/${t.id}`,
      })),
    },
    {
      label: "People",
      hits: ((people.data ?? []) as Array<{ id: string; name: string; role: string | null }>).map((p) => ({
        icon: "Users",
        title: p.name,
        sub: String(p.role ?? "Crew"),
        href: "/m/directory",
      })),
    },
    {
      label: "Assets",
      hits: ((assets.data ?? []) as Array<{ id: string; title: string | null; catalog_kind: string | null }>).map(
        (a) => ({
          icon: "Package",
          title: a.title ?? String(a.catalog_kind ?? "Asset"),
          sub: String(a.catalog_kind ?? ""),
          href: `/m/advances/${a.id}`,
        }),
      ),
    },
    {
      label: "Docs",
      hits: ((docs.data ?? []) as Array<{ id: string; title: string; category: string | null }>).map((d) => ({
        icon: "BookOpen",
        title: d.title,
        sub: String(d.category ?? "Knowledge"),
        href: `/m/docs/${d.id}`,
      })),
    },
    {
      label: "Templates",
      hits: ((templates.data ?? []) as Array<{ id: string; name: string; category: string | null }>).map((tpl) => ({
        icon: "LayoutTemplate",
        title: tpl.name,
        sub: String(tpl.category ?? "Template"),
        href: "/m/templates",
      })),
    },
    {
      label: "Spaces",
      hits: ((spaces.data ?? []) as Array<{ id: string; name: string | null; space_kind: string | null }>).map(
        (s) => ({
          icon: "UsersRound",
          title: s.name ?? "Space",
          sub: String(s.space_kind ?? "Space"),
          href: `/m/spaces/${s.id}`,
        }),
      ),
    },
    {
      label: "Calendar",
      hits: ((events.data ?? []) as Array<{ id: string; name: string; starts_at: string | null }>).map((e) => ({
        icon: "CalendarDays",
        title: e.name,
        sub: e.starts_at ? new Date(e.starts_at).toISOString().slice(0, 10) : "Event",
        href: "/m/schedule",
      })),
    },
    {
      label: "Jobs",
      hits: ((jobs.data ?? []) as Array<{ id: string; title: string; employment_type: string | null }>).map((j) => ({
        icon: "Briefcase",
        title: j.title,
        sub: String(j.employment_type ?? "Job"),
        href: "/m/jobs",
      })),
    },
  ].filter((g) => g.hits.length > 0);

  return { groups };
}
