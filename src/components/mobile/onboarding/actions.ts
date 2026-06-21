"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Provider } from "@supabase/supabase-js";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";
import type { Json } from "@/lib/supabase/database.types";
import { saveProfileData, type EmergencyContactInput } from "@/lib/profile/write";

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

/**
 * Persist the kit onboarding profile into the real 3NF tables via
 * `saveProfileData`. The kit profile form (CompvssOnboarding.tsx) posts these
 * FormData fields: display_name, username, phone, linkedin, spotify, instagram,
 * website, pronouns, title, bio, city, emergency_1/_phone, emergency_2/_phone,
 * dietary, home_airport, dob, passport, visas, known_traveler, loyalty,
 * size_shirt/_pants/_shoe/_glove, certifications, skills. The canonical display
 * name is also written to `users.name`.
 */
export async function saveProfileAction(fd: FormData): Promise<SaveResult> {
  const session = await requireSession();
  const supabase = await createClient();

  const str = (k: string): string | undefined => {
    const v = fd.get(k);
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t.length ? t : undefined;
  };
  /** Split a "A · B · C" / comma list into trimmed tokens. */
  const list = (k: string): string[] => {
    const v = str(k);
    if (!v) return [];
    return v
      .split(/[·,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const displayName = str("display_name") ?? str("name");

  // users.name (the canonical identity name).
  if (displayName) {
    const { error: uErr } = await supabase
      .from("users")
      .update({ name: displayName })
      .eq("id", session.userId);
    if (uErr) return { error: uErr.message };
  }

  // Emergency contacts — "Name · relation" + phone, two slots in the kit.
  const emergencyContacts: EmergencyContactInput[] = [];
  for (const [i, base] of (["emergency_1", "emergency_2"] as const).entries()) {
    const raw = str(base);
    if (!raw) continue;
    const [name, relationship] = raw.split("·").map((s) => s.trim());
    emergencyContacts.push({
      name: name || raw,
      relationship: relationship || null,
      phone: str(`${base}_phone`) ?? null,
      priority: i + 1,
    });
  }

  const res = await saveProfileData(supabase, session.userId, {
    displayName: displayName ?? undefined,
    publicHandle: str("username"),
    bio: str("bio"),
    pronouns: str("pronouns"),
    roleTitle: str("title"),
    dietaryRestrictions: str("dietary"),
    phone: str("phone"),
    locationCity: str("city"),
    social: {
      linkedin: str("linkedin") ?? "",
      spotify: str("spotify") ?? "",
      instagram: str("instagram") ?? "",
      website: str("website") ?? "",
    },
    emergencyContacts,
    travel: {
      homeAirport: str("home_airport"),
      dateOfBirth: str("dob"),
      passportNumber: str("passport"),
      knownTravelerNumber: str("known_traveler"),
      visas: str("visas"),
      loyaltyPrograms: str("loyalty"),
    },
    uniform: {
      shirt: str("size_shirt"),
      pants: str("size_pants"),
      shoe: str("size_shoe"),
      glove: str("size_glove"),
    },
    certifications: list("certifications").map((name) => ({ name })),
    skills: list("skills"),
  });
  if (res) return { error: res.error };

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
  // enabled toggle. We persist the granted state + a requested-at stamp for
  // each toggle into the real `user_app_permissions` table.
  const { language, perms } = parsed.data;
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error: permErr } = await supabase.from("user_app_permissions").upsert(
    {
      user_id: session.userId,
      language,
      location_granted: perms.location,
      notifications_granted: perms.notifications,
      camera_granted: perms.camera,
      bluetooth_granted: perms.bluetooth,
      location_requested_at: now,
      notifications_requested_at: now,
      camera_requested_at: now,
      bluetooth_requested_at: now,
    },
    { onConflict: "user_id" },
  );
  if (permErr) return { error: permErr.message };

  // Keep the chosen UI language on user_preferences.locale (the i18n source).
  return upsertPreferences(session.userId, { locale: language });
}

/** Mark onboarding complete (user_account_status.onboarded_at) and revalidate
 * the field shell. account_state defaults to 'active' on first insert. */
export async function completeOnboardingAction(): Promise<SaveResult> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("user_account_status").upsert(
    { user_id: session.userId, account_state: "active", onboarded_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/m");
  return { ok: true };
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
