import "server-only";

import type { GqlContext } from "./context";

/**
 * GraphQL resolvers — Round 76 (G-031).
 *
 * Org-scoped reads. Every resolver applies .eq("org_id", session.orgId)
 * to defend against schema drift; RLS at the DB layer is the second guard.
 *
 * Field naming converts snake_case (Postgres) to camelCase (GraphQL).
 */

type Page = { limit?: number | null; offset?: number | null } | null | undefined;

function paginate<T extends { range: (from: number, to: number) => T }>(qb: T, page: Page): T {
  const limit = Math.min(Math.max(page?.limit ?? 50, 1), 200);
  const offset = Math.max(page?.offset ?? 0, 0);
  return qb.range(offset, offset + limit - 1);
}

function camel<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row)) {
    const ck = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[ck] = row[k];
  }
  return out;
}

function camelAll<T extends Record<string, unknown>>(rows: T[] | null | undefined): Record<string, unknown>[] {
  return (rows ?? []).map(camel);
}

async function fetchOne(ctx: GqlContext, table: string, id: string, cols: string) {
  const { data } = await ctx.supabase
    .from(table)
    .select(cols)
    .eq("id", id)
    .eq("org_id", ctx.session.orgId)
    .maybeSingle();
  return data ? camel(data as Record<string, unknown>) : null;
}

async function fetchMany(ctx: GqlContext, table: string, cols: string, projectId: string | null, page: Page) {
  let qb = ctx.supabase
    .from(table)
    .select(cols)
    .eq("org_id", ctx.session.orgId)
    .order("created_at", { ascending: false });
  if (projectId) qb = qb.eq("project_id", projectId);
  qb = paginate(qb, page);
  const { data } = await qb;
  return camelAll(data as Record<string, unknown>[] | null);
}

export const resolvers = {
  Query: {
    viewer: (_p: unknown, _a: unknown, ctx: GqlContext) => ({
      userId: ctx.session.userId,
      email: ctx.session.email,
      orgId: ctx.session.orgId,
      orgSlug: ctx.session.orgSlug,
      role: ctx.session.role,
    }),

    org: async (_p: unknown, _a: unknown, ctx: GqlContext) => {
      const { data } = await ctx.supabase
        .from("orgs")
        .select("id, slug, name, default_currency, default_locale, default_timezone")
        .eq("id", ctx.session.orgId)
        .maybeSingle();
      return data ? camel(data as Record<string, unknown>) : null;
    },

    project: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(ctx, "projects", id, "id, name, code, status, start_date, end_date, address, created_at, updated_at"),
    projects: async (_p: unknown, { page }: { page?: Page }, ctx: GqlContext) => {
      let qb = ctx.supabase
        .from("projects")
        .select("id, name, code, status, start_date, end_date, address, created_at, updated_at")
        .eq("org_id", ctx.session.orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      qb = paginate(qb, page);
      const { data } = await qb;
      return camelAll(data as Record<string, unknown>[] | null);
    },

    rfi: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "rfis",
        id,
        "id, project_id, number, title, status, due_at, asked_at, asked_by, answered_at, answered_by, created_at",
      ),
    rfis: (_p: unknown, { projectId, page }: { projectId?: string | null; page?: Page }, ctx: GqlContext) =>
      fetchMany(
        ctx,
        "rfis",
        "id, project_id, number, title, status, due_at, asked_at, asked_by, answered_at, answered_by, created_at",
        projectId ?? null,
        page,
      ),

    submittal: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(ctx, "submittals", id, "id, project_id, number, title, status, submitted_at, required_at, created_at"),
    submittals: (_p: unknown, { projectId, page }: { projectId?: string | null; page?: Page }, ctx: GqlContext) =>
      fetchMany(
        ctx,
        "submittals",
        "id, project_id, number, title, status, submitted_at, required_at, created_at",
        projectId ?? null,
        page,
      ),

    dailyLog: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "daily_logs",
        id,
        "id, project_id, log_date, summary, weather_temp_high_f, weather_temp_low_f, weather_precip_in, weather_conditions, weather_source, created_at",
      ),
    dailyLogs: (_p: unknown, { projectId, page }: { projectId?: string | null; page?: Page }, ctx: GqlContext) =>
      fetchMany(
        ctx,
        "daily_logs",
        "id, project_id, log_date, summary, weather_temp_high_f, weather_temp_low_f, weather_precip_in, weather_conditions, weather_source, created_at",
        projectId ?? null,
        page,
      ),

    task: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "tasks",
        id,
        "id, project_id, title, description, status, priority, assignee_id, due_at, created_at",
      ),
    tasks: (_p: unknown, { projectId, page }: { projectId?: string | null; page?: Page }, ctx: GqlContext) =>
      fetchMany(
        ctx,
        "tasks",
        "id, project_id, title, description, status, priority, assignee_id, due_at, created_at",
        projectId ?? null,
        page,
      ),

    invoice: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "invoices",
        id,
        "id, project_id, client_id, entity_id, number, title, amount_cents, currency, status, issued_at, due_at, paid_at, base_currency, base_amount_cents, fx_rate_to_base, created_at",
      ),
    invoices: async (
      _p: unknown,
      { projectId, entityId, page }: { projectId?: string | null; entityId?: string | null; page?: Page },
      ctx: GqlContext,
    ) => {
      let qb = ctx.supabase
        .from("invoices")
        .select(
          "id, project_id, client_id, entity_id, number, title, amount_cents, currency, status, issued_at, due_at, paid_at, base_currency, base_amount_cents, fx_rate_to_base, created_at",
        )
        .eq("org_id", ctx.session.orgId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (projectId) qb = qb.eq("project_id", projectId);
      if (entityId) qb = qb.eq("entity_id", entityId);
      qb = paginate(qb, page);
      const { data } = await qb;
      return camelAll(data as Record<string, unknown>[] | null);
    },

    expense: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "expenses",
        id,
        "id, project_id, entity_id, submitter_id, category, description, amount_cents, currency, status, spent_at, base_currency, base_amount_cents, created_at",
      ),
    expenses: async (
      _p: unknown,
      { projectId, entityId, page }: { projectId?: string | null; entityId?: string | null; page?: Page },
      ctx: GqlContext,
    ) => {
      let qb = ctx.supabase
        .from("expenses")
        .select(
          "id, project_id, entity_id, submitter_id, category, description, amount_cents, currency, status, spent_at, base_currency, base_amount_cents, created_at",
        )
        .eq("org_id", ctx.session.orgId)
        .order("created_at", { ascending: false });
      if (projectId) qb = qb.eq("project_id", projectId);
      if (entityId) qb = qb.eq("entity_id", entityId);
      qb = paginate(qb, page);
      const { data } = await qb;
      return camelAll(data as Record<string, unknown>[] | null);
    },

    orgEntity: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(
        ctx,
        "org_entities",
        id,
        "id, legal_name, short_code, base_currency, jurisdiction, consolidation_method, ownership_pct, consolidation_state, parent_entity_id, effective_from, effective_to",
      ),
    orgEntities: async (_p: unknown, _a: unknown, ctx: GqlContext) => {
      const { data } = await ctx.supabase
        .from("org_entities")
        .select(
          "id, legal_name, short_code, base_currency, jurisdiction, consolidation_method, ownership_pct, consolidation_state, parent_entity_id, effective_from, effective_to",
        )
        .eq("org_id", ctx.session.orgId)
        .is("deleted_at", null)
        .order("legal_name");
      return camelAll(data as Record<string, unknown>[] | null);
    },

    vendor: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(ctx, "vendors", id, "id, name, email, phone, website, created_at"),
    vendors: async (_p: unknown, { page }: { page?: Page }, ctx: GqlContext) => {
      let qb = ctx.supabase
        .from("vendors")
        .select("id, name, email, phone, website, created_at")
        .eq("org_id", ctx.session.orgId)
        .is("deleted_at", null)
        .order("name");
      qb = paginate(qb, page);
      const { data } = await qb;
      return camelAll(data as Record<string, unknown>[] | null);
    },

    client: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(ctx, "clients", id, "id, name, email, phone, created_at"),
    clients: async (_p: unknown, { page }: { page?: Page }, ctx: GqlContext) => {
      let qb = ctx.supabase
        .from("clients")
        .select("id, name, email, phone, created_at")
        .eq("org_id", ctx.session.orgId)
        .is("deleted_at", null)
        .order("name");
      qb = paginate(qb, page);
      const { data } = await qb;
      return camelAll(data as Record<string, unknown>[] | null);
    },

    sitePlan: (_p: unknown, { id }: { id: string }, ctx: GqlContext) =>
      fetchOne(ctx, "site_plans", id, "id, project_id, name, sheet_number, revision, page_count, created_at"),
    sitePlans: (_p: unknown, { projectId, page }: { projectId?: string | null; page?: Page }, ctx: GqlContext) =>
      fetchMany(
        ctx,
        "site_plans",
        "id, project_id, name, sheet_number, revision, page_count, created_at",
        projectId ?? null,
        page,
      ),
  },
};
