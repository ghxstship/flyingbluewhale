"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAdmin, isManagerPlus, requireSession, type Session } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { sendEmail, wrapEmailHtml } from "@/lib/email";
import { emitAudit } from "@/lib/audit";
import { urlFor } from "@/lib/urls";
import { PRODUCT_ACCENTS } from "@/lib/brand";
import { PLATFORM_ROLES } from "@/lib/supabase/types";
import { CATALOG_KINDS } from "@/lib/db/catalog-kinds";
import type { FormState } from "@/components/FormShell";
import { actionFail, formFail } from "@/lib/forms/fail";
import { BASE_KIT_COST_CENTERS, BASE_KIT_POSITIONS } from "./base-kit";

const START_PATH = "/legend/start";

/**
 * LEG3ND /start onboarding actions (marketing rebuild plan section 10).
 *
 * Every action is Zod-validated at the boundary, org-pinned to the caller's
 * session, and reads the row back after writing (an RLS no-op write returns
 * no error, so the read-back is the only honest success signal).
 *
 * "Guest" sessions (the auto-added demo-org membership is the user's only
 * org) have no organization of their own yet: step 1 creates one, and every
 * other step refuses to write into the shared demo org.
 */
function noOrgYet(session: Session): boolean {
  return session.persona === "guest";
}

// ── Step 1 · Identity: create the organization ──────────────────────────────
// Same RPC contract as the auth flow's bootstrap helper
// (src/app/(auth)/actions.ts bootstrapOrgIfNeeded): create_org_with_owner
// with p_slug "" so the database derives the slug from the name.

const OrgSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(120),
});

export async function createStartOrgAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (!noOrgYet(session)) {
    return { error: "You already belong to an organization. Step 1 is complete." };
  }

  const parsed = OrgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_org_with_owner", {
    p_name: parsed.data.name,
    p_slug: "",
  });
  if (error) return actionFail(`Couldn't create the organization: ${error.message}`, fd);

  // Read-back: the RPC returns the new org row reference.
  const created = data?.[0];
  if (!created?.org_id) return { error: "Organization was not created. Try again." };

  // Point the workspace switcher at the new org so the next request's
  // session resolves here instead of the demo fallback. Best-effort: the
  // membership row alone already makes getSession prefer the real org.
  try {
    await supabase
      .from("user_preferences")
      .upsert({ user_id: session.userId, last_org_id: created.org_id }, { onConflict: "user_id" });
  } catch {
    // Advisory pointer only; never block org creation on it.
  }

  revalidatePath(START_PATH);
  return { ok: true };
}

// ── Step 2 · Base kit install ────────────────────────────────────────────────

export async function installBaseKitAction(_: FormState, __: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  // The RPC itself enforces owner/admin; gate here for a clear message.
  if (!isAdmin(session)) return { error: "Only an owner or admin can install the base kit." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("seed_org_xpms_defaults", { p_org_id: session.orgId });

  if (error) {
    // Known defect in the deployed RPC (verified live 2026-07-22): the
    // cost_centers insert omits `scope`, which is NOT NULL with no default,
    // so the function raises 23502 for any org that doesn't already carry
    // all 10 codes. Until the migration is patched, seed app-side with the
    // identical rows (scope 'org' is the canon value on every existing row;
    // RLS: cost_centers writes are manager-band, positions inserts are
    // manager-band, and this path is already gated owner/admin above).
    const fallback = await seedBaseKitAppSide(session.orgId);
    if (fallback) return { error: fallback };
  }

  // Read-back: the step only counts as installed if the rows exist.
  const [{ count: ccCount }, { count: posCount }] = await Promise.all([
    supabase.from("cost_centers").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("positions").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);
  if (!ccCount && !posCount) {
    return { error: "The base kit did not install. Nothing was written." };
  }

  revalidatePath(START_PATH);
  return { ok: true };
}

/** Idempotent app-side mirror of seed_org_xpms_defaults. Returns an error string or null. */
async function seedBaseKitAppSide(orgId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: existingCc, error: ccReadErr } = await supabase
    .from("cost_centers")
    .select("code")
    .eq("org_id", orgId);
  if (ccReadErr) return `Base kit install failed: ${ccReadErr.message}`;
  const haveCodes = new Set((existingCc ?? []).map((r) => r.code));
  const ccRows = BASE_KIT_COST_CENTERS
    .filter(([code]) => !haveCodes.has(code))
    .map(([code, name]) => ({ org_id: orgId, code, name, scope: "org", active: true }));
  if (ccRows.length > 0) {
    const { error: ccErr } = await supabase.from("cost_centers").insert(ccRows);
    if (ccErr) return `Base kit install failed on cost centers: ${ccErr.message}`;
  }

  const { data: existingPos, error: posReadErr } = await supabase
    .from("positions")
    .select("title")
    .eq("org_id", orgId);
  if (posReadErr) return `Base kit install failed: ${posReadErr.message}`;
  const haveTitles = new Set((existingPos ?? []).map((r) => r.title.toLowerCase()));
  const posRows = BASE_KIT_POSITIONS
    .filter(([title]) => !haveTitles.has(title.toLowerCase()))
    .map(([title, dept]) => ({ org_id: orgId, title, department_code: dept }));
  if (posRows.length > 0) {
    const { error: posErr } = await supabase.from("positions").insert(posRows);
    if (posErr) return `Base kit install failed on positions: ${posErr.message}`;
  }

  return null;
}

// ── Step 3 · Organization: position library ─────────────────────────────────

const PositionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  department_code: z
    .string()
    .regex(/^\d000$/, "Pick a department")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  summary: z
    .string()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function addPositionAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  if (!isManagerPlus(session)) return { error: "Only manager and above can edit the position library." };

  const parsed = PositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      department_code: parsed.data.department_code ?? null,
      summary: parsed.data.summary ?? null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return actionFail("A position with that title already exists.", fd);
    return actionFail(error.message, fd);
  }
  if (!data) return { error: "The position was not saved." };

  revalidatePath(START_PATH);
  return { ok: true };
}

const RenamePositionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1, "Title is required").max(120),
});

export async function renamePositionAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  if (!isManagerPlus(session)) return { error: "Only manager and above can edit the position library." };

  const parsed = RenamePositionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("positions")
    .update({ title: parsed.data.title })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) {
    if (error.code === "23505") return actionFail("A position with that title already exists.", fd);
    return actionFail(error.message, fd);
  }
  // RLS no-op writes return no error; the empty read-back is the signal.
  if (!data || data.length === 0) return { error: "Nothing was renamed. Check the position still exists." };

  revalidatePath(START_PATH);
  return { ok: true };
}

// ── Step 4 · Finance codes: cost centers ─────────────────────────────────────

const RenameCostCenterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, "Name is required").max(120),
});

export async function renameCostCenterAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  if (!isManagerPlus(session)) return { error: "Only manager and above can edit finance codes." };

  const parsed = RenameCostCenterSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cost_centers")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .select("id");
  if (error) return actionFail(error.message, fd);
  if (!data || data.length === 0) return { error: "Nothing was renamed. Check the cost center still exists." };

  revalidatePath(START_PATH);
  return { ok: true };
}

const AddCostCenterSchema = z.object({
  code: z.string().regex(/^\d{4}$/, "Four digits, like 6500"),
  name: z.string().trim().min(1, "Name is required").max(120),
});

export async function addCostCenterAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  if (!isManagerPlus(session)) return { error: "Only manager and above can edit finance codes." };

  const parsed = AddCostCenterSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cost_centers")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("code", parsed.data.code)
    .maybeSingle();
  if (existing) return actionFail(`Code ${parsed.data.code} already exists.`, fd);

  const { data, error } = await supabase
    .from("cost_centers")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      scope: "org",
      active: true,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  if (!data) return { error: "The cost center was not saved." };

  revalidatePath(START_PATH);
  return { ok: true };
}

// ── Step 5 · Locations ───────────────────────────────────────────────────────

const LocationSchema = z.object({
  name: z.string().trim().min(1, "Location name is required").max(160),
  address: z
    .string()
    .max(240)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  city: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  country: z
    .string()
    .max(120)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function addLocationAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  // RLS: locations_insert is owner/admin/manager/controller/collaborator.
  if (!isManagerPlus(session)) return { error: "Only manager and above can add locations." };

  const parsed = LocationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      city: parsed.data.city ?? null,
      country: parsed.data.country ?? null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  if (!data) return { error: "The location was not saved." };

  revalidatePath(START_PATH);
  return { ok: true };
}

// ── Step 6 · Catalogs: quick add ─────────────────────────────────────────────
// Mirrors the console action (/studio/settings/catalog/new): same table,
// same field contract, same manager+ gate.

const CatalogItemSchema = z.object({
  kind: z.enum(CATALOG_KINDS),
  code: z
    .string()
    .min(1, "Code is required")
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  name: z.string().trim().min(1, "Name is required").max(200),
});

export async function addCatalogItemAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  if (!isManagerPlus(session)) return { error: "Only manager and above can edit the master catalog." };

  const parsed = CatalogItemSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data, error } = await supabase
    // soft-delete-exempt: insert-returning — .select("id") reads back the row just created
    .from("master_catalog_items")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      code: parsed.data.code.toLowerCase(),
      name: parsed.data.name,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return actionFail("That code is already in the catalog.", fd);
    return actionFail(error.message, fd);
  }
  if (!data) return { error: "The catalog item was not saved." };

  revalidatePath(START_PATH);
  return { ok: true };
}

// ── Step 8 · Crew invites ────────────────────────────────────────────────────
// Same table and insert shape as the console invite flow
// (/studio/people/invites): invites row + acceptance link on the apex.

const InviteSchema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.enum(PLATFORM_ROLES),
});

export async function sendInviteAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const session = await requireSession();
  if (noOrgYet(session)) return { error: "Create your organization in step 1 first." };
  // RLS: invites_insert_admin is owner/admin/developer.
  if (!isAdmin(session)) return { error: "Only owners and admins can send invites." };

  const parsed = InviteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  const supabase = await createClient();
  const { data: invite, error } = await supabase
    .from("invites")
    .insert({
      org_id: session.orgId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      invited_by: session.userId,
    })
    .select("id, token")
    .single();
  if (error) {
    if (error.code === "23505") return actionFail("A pending invite already exists for this email.", fd);
    return actionFail(error.message, fd);
  }
  if (!invite) return { error: "The invite was not saved." };

  const acceptUrl = urlFor("auth", `/accept-invite/${invite.token}`);
  const sent = await sendEmail({
    to: parsed.data.email,
    subject: "You're invited to join an ATLVS Technologies workspace",
    html: startInviteEmailHtml(session.email, parsed.data.role, acceptUrl),
  });

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.invite.created",
    targetTable: "invites",
    targetId: invite.id,
    metadata: { email: parsed.data.email.toLowerCase(), role: parsed.data.role, via: "legend_start" },
  });

  revalidatePath(START_PATH);
  if (!sent.ok) {
    // The row is the source of truth; surface the delivery failure honestly.
    return {
      error: "Invite saved, but the email could not be sent. Resend it from the console invites page.",
    };
  }
  return { ok: true };
}

function startInviteEmailHtml(inviterEmail: string, role: string, acceptUrl: string): string {
  return wrapEmailHtml(`
      <p style="color:#5b6472;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-family:'Space Mono','Courier New',monospace;margin:0">Invitation</p>
      <h1 style="font-family:'Anton','Arial Narrow','Helvetica Neue',Arial,sans-serif;font-size:32px;font-weight:400;margin:12px 0 8px;letter-spacing:0.005em;text-transform:uppercase">You've been invited</h1>
      <p style="color:#181b23;font-size:14px">${inviterEmail} invited you to join their workspace as ${role}.</p>
      <p><a href="${acceptUrl}" style="display:inline-block;background:${PRODUCT_ACCENTS.atlvs};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">Accept invitation</a></p>
      <p style="color:#8c95a3;font-size:12px;margin-top:24px;font-family:'Space Mono','Courier New',monospace">Link expires in 7 days. If the button doesn't work:<br/><code>${acceptUrl}</code></p>`);
}
