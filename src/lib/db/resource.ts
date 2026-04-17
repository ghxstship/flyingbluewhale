import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type PublicTables = Database["public"]["Tables"];
type TableName = keyof PublicTables;

export type ListOpts = {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  filters?: Array<{ column: string; op: "eq" | "in" | "gte" | "lte"; value: unknown }>;
};

async function anyFrom(t: string) {
  const supabase = await createClient();
  return (supabase as unknown as { from: (t: string) => any }).from(t);
}

export async function listOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  opts: ListOpts = {},
): Promise<PublicTables[T]["Row"][]> {
  let q = (await anyFrom(table as string)).select("*").eq("org_id", orgId);
  for (const f of opts.filters ?? []) {
    if (f.op === "eq") q = q.eq(f.column, f.value);
    else if (f.op === "in") q = q.in(f.column, f.value as unknown[]);
    else if (f.op === "gte") q = q.gte(f.column, f.value);
    else if (f.op === "lte") q = q.lte(f.column, f.value);
  }
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false });
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as PublicTables[T]["Row"][];
}

export async function getOrgScoped<T extends TableName>(
  table: T,
  orgId: string,
  id: string,
): Promise<PublicTables[T]["Row"] | null> {
  const { data, error } = await (await anyFrom(table as string))
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as PublicTables[T]["Row"] | null;
}

export async function countOrgScoped<T extends TableName>(table: T, orgId: string): Promise<number> {
  const { count } = await (await anyFrom(table as string))
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId);
  return count ?? 0;
}
