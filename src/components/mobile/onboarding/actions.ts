"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Provider } from "@supabase/supabase-js";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";
import type { Json } from "@/lib/supabase/database.types";

/**
 * COMPVSS mobile auth + onboarding server actions.
 *
 * Mirrors the Supabase auth-call patterns in `src/app/(auth)/actions.ts`, but
 * this is the mobile flow's own surface — it never throws for expected errors;
 * each action returns a small result object the client renders inline. Note
 * (`"use server"` rule): ONLY async functions are exported from this module.
 */

// ── Result types (local — not exported, per the "use server" only-async-exports
//    rule; the client re-derives shapes from awaited returns) ──────────────────
type SignUpResult = { error?: string; needsVerify?: boolean };
type AuthResult = { error?: string };
type OAuthResult = { error?: string; url?: string };
type JoinResult = { error?: string; pending?: boolean; ok?: true };
type SaveResult = { error?: string; ok?: true };

const SignUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid work email"),
  phone: z.string().max(40).optional(),
  password: z.string().min(8, "At least 8 characters").max(128),
});

const VerifySchema = z.object({
  email: z.string().email(),
  token: z.string().min(4).max(12),
});

const EmailSchema = z.object({ email: z.string().email("Enter a valid email") });

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const JoinSchema = z.object({
  code: z.string().min(1, "Enter a code").max(64),
});

const PermissionsSchema = z.object({
  language: z.string().min(2).max(16),
  perms: z.object({
    location: z.boolean(),
    notifications: z.boolean(),
    camera: z.boolean(),
    bluetooth: z.boolean(),
  }),
});

/** Sign up with email + password. Returns needsVerify when no session is
 * minted (email-confirmation / OTP flows); otherwise the session is live. */
export async function signUpAction(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<SignUpResult> {
  if (!hasSupabase) return { error: "Sign-up is unavailable right now." };
  const parsed = SignUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields above." };
  }
  const { name, email, phone, password } = parsed.data;
  const supabase = await createClient();
  const emailRedirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/m")}`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, name, phone: phone ?? null },
      emailRedirectTo,
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { error: "An account with this email exists — try signing in." };
    }
    return { error: error.message };
  }
  // No session → email/OTP verification required.
  if (!data.session) return { needsVerify: true };
  return {};
}

/** Verify a 6-digit email OTP. */
export async function verifyOtpAction(input: { email: string; token: string }): Promise<AuthResult> {
  if (!hasSupabase) return { error: "Verification is unavailable right now." };
  const parsed = VerifySchema.safeParse(input);
  if (!parsed.success) return { error: "Enter the 6-digit code." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });
  if (error) return { error: "That code didn't match — try again or resend." };
  return {};
}

/** Resend an email OTP / magic code. */
export async function resendOtpAction(input: { email: string }): Promise<AuthResult> {
  if (!hasSupabase) return { error: "Resend is unavailable right now." };
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your email." };
  const supabase = await createClient();
  const emailRedirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/m")}`);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { emailRedirectTo },
  });
  if (error) return { error: error.message };
  return {};
}

/** Sign in with email + password. */
export async function signInAction(input: { email: string; password: string }): Promise<AuthResult> {
  if (!hasSupabase) return { error: "Sign-in is unavailable right now." };
  const parsed = SignInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the fields above." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Invalid email or password." };
  return {};
}

/** Send a password-reset email. */
export async function forgotAction(input: { email: string }): Promise<AuthResult> {
  if (!hasSupabase) return { error: "Reset is unavailable right now." };
  const parsed = EmailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your email." };
  const supabase = await createClient();
  const redirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/reset-password")}`);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) return { error: error.message };
  return {};
}

/** Build an OAuth authorize URL (browser-redirect skipped so the client
 * controls the navigation). */
export async function oauthUrlAction(provider: Provider): Promise<OAuthResult> {
  if (!hasSupabase) return { error: "Single sign-on is unavailable right now." };
  const supabase = await createClient();
  const redirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/m")}`);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error: error.message };
  if (!data?.url) return { error: "Couldn't start single sign-on." };
  return { url: data.url };
}

/** Persist profile basics. Writes name → users; display_name / public_handle /
 * bio / links → user_profiles. Tolerates missing optional fields. */
export async function saveProfileAction(fd: FormData): Promise<SaveResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const str = (k: string): string | undefined => {
    const v = fd.get(k);
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length ? t : undefined;
  };

  const displayName = str("display_name") ?? str("name");
  const username = str("username");
  const bio = str("bio");

  // Optional contact / social links → user_profiles.links jsonb (no dedicated
  // columns exist for phone/linkedin/spotify/instagram/website).
  const links: Record<string, string> = {};
  for (const key of ["phone", "linkedin", "spotify", "instagram", "website"] as const) {
    const v = str(key);
    if (v) links[key] = v;
  }

  // users.name (the canonical identity name).
  if (displayName) {
    const { error: uErr } = await supabase
      .from("users")
      .update({ name: displayName })
      .eq("id", session.userId);
    if (uErr) return { error: uErr.message };
  }

  // user_profiles — upsert the portable crew identity. `links` is merged with
  // any existing value so a partial save doesn't blow away prior links.
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("links")
    .eq("user_id", session.userId)
    .maybeSingle();
  const existingLinks =
    (existingProfile?.links as Record<string, string> | null | undefined) ?? {};
  const mergedLinks = { ...existingLinks, ...links } as Json;

  const profileRow: Record<string, unknown> = {
    user_id: session.userId,
    links: mergedLinks,
  };
  if (displayName) profileRow.display_name = displayName;
  if (username) profileRow.public_handle = username;
  if (bio) profileRow.bio = bio;

  const { error: pErr } = await (
    supabase.from("user_profiles") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(profileRow, { onConflict: "user_id" });
  if (pErr) return { error: pErr.message };

  // Ensure a user_preferences row exists so later steps can append ui_state.
  await upsertPreferences(session.userId, {});

  return { ok: true };
}

/** Best-effort org join by access code. Resolves an open invite by token →
 * creates a membership. If nothing maps cleanly the code is recorded as a
 * pending request on user_preferences.ui_state.join_code (no fabricated
 * tables). */
export async function joinOrgAction(input: { code: string }): Promise<JoinResult> {
  const session = await requireSession();
  const parsed = JoinSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a code." };
  const code = parsed.data.code.trim();
  const supabase = await createClient();

  // Treat the access code as an invite token. Only honor an open, unexpired,
  // email-matching invite — anything else is recorded as a pending request.
  const { data: invite } = await supabase
    .from("invites")
    .select("id, org_id, role, persona, email, invite_state, expires_at, project_id")
    .eq("token", code)
    .maybeSingle();

  const now = Date.now();
  const isOpen =
    invite &&
    invite.invite_state === "pending" &&
    (!invite.expires_at || new Date(invite.expires_at).getTime() > now) &&
    (!invite.email || invite.email.toLowerCase() === session.email.toLowerCase());

  if (isOpen && invite) {
    const { error: mErr } = await (
      supabase.from("memberships") as unknown as {
        upsert: (
          p: Record<string, unknown>,
          opts?: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).upsert(
      {
        org_id: invite.org_id,
        user_id: session.userId,
        role: invite.role ?? "member",
        persona: invite.persona ?? "crew",
        deleted_at: null,
      },
      { onConflict: "org_id,user_id" },
    );
    if (mErr) {
      // Membership write blocked (RLS) — fall through to recording intent so
      // the user isn't stuck; an admin can reconcile.
      await recordJoinCode(session.userId, code, "blocked");
      return { pending: true };
    }
    // Flip the invite to accepted (best-effort; ignore RLS denial).
    await supabase
      .from("invites")
      .update({ invite_state: "accepted", accepted_at: new Date().toISOString(), accepted_by: session.userId })
      .eq("id", invite.id);
    return { ok: true };
  }

  // No clean match — record the request and let the user continue.
  await recordJoinCode(session.userId, code, "requested");
  return { pending: true };
}

/** Persist language + the four field-access permission intents. On native
 * (Capacitor) these flags would drive runtime permission prompts. */
export async function savePermissionsAction(input: {
  language: string;
  perms: { location: boolean; notifications: boolean; camera: boolean; bluetooth: boolean };
}): Promise<SaveResult> {
  const session = await requireSession();
  const parsed = PermissionsSchema.safeParse(input);
  if (!parsed.success) return { error: "Couldn't save your preferences." };

  // TODO(native): when wrapped in Capacitor, request the matching OS
  // permissions here (Geolocation, Push, Camera, Bluetooth/NFC) for each
  // enabled toggle. For now we persist the intended state only.
  const res = await upsertPreferences(session.userId, {
    locale: parsed.data.language,
    uiPatch: { permissions: parsed.data.perms },
  });
  return res;
}

/** Mark onboarding complete and revalidate the field shell. */
export async function completeOnboardingAction(): Promise<SaveResult> {
  const session = await requireSession();
  const res = await upsertPreferences(session.userId, { uiPatch: { onboarded: true } });
  revalidatePath("/m");
  return res;
}

// ── helpers ──────────────────────────────────────────────────────────────────

/** Read current ui_state, shallow-merge a patch, and upsert preferences. */
async function upsertPreferences(
  userId: string,
  opts: { locale?: string; uiPatch?: Record<string, unknown> },
): Promise<SaveResult> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("user_preferences")
    .select("ui_state")
    .eq("user_id", userId)
    .maybeSingle();
  const ui = (existing?.ui_state as Record<string, unknown> | null) ?? {};
  const nextUi = { ...ui, ...(opts.uiPatch ?? {}) } as Json;

  const row: Record<string, unknown> = { user_id: userId, ui_state: nextUi };
  if (opts.locale) row.locale = opts.locale;

  const { error } = await (
    supabase.from("user_preferences") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(row, { onConflict: "user_id" });
  if (error) return { error: error.message };
  return { ok: true };
}

/** Record a join-code request on ui_state.join_code when no invite resolved. */
async function recordJoinCode(
  userId: string,
  code: string,
  state: "requested" | "blocked",
): Promise<void> {
  await upsertPreferences(userId, {
    uiPatch: { join_code: { code, state, requested_at: new Date().toISOString() } },
  });
}
