"use server";

import { redirect } from "next/navigation";
import { z, type ZodIssue } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { urlFor } from "@/lib/urls";
import { emitAudit } from "@/lib/audit";
import type { FormState } from "@/components/FormShell";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/validation/constraints";

// NOTE: Next.js server-action files (`"use server"`) cannot re-export types —
// every export becomes an RPC endpoint, and a type re-export crashes at runtime
// (ReferenceError: FormState is not defined). Form components must import
// FormState from @/components/FormShell directly.

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

/**
 * Validate a post-login destination. Internal absolute paths only —
 * rejects protocol-relative (`//evil.com`), absolute URLs, and anything
 * not starting with a single `/`. Mirrors the OAuth NextSchema guard.
 */
function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  if (raw.length > 512) return null;
  return raw;
}

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`).max(PASSWORD_MAX_LENGTH),
  orgName: z.string().max(120).optional(),
  // E-17: plan intent carried from the pricing CTA (`/signup?plan=`). Stored
  // as user metadata and later stamped onto the created org — intent only,
  // no billing/tier mechanics.
  plan: z.enum(["free", "crew", "production", "festival"]).optional(),
});

const EmailOnlySchema = z.object({
  email: z.string().email("Enter a valid email"),
});

function zodToFieldErrors(issues: ZodIssue[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function loginAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) {
    return { error: "Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY." };
  }
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Check the fields below", fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { email, password } = parsed.data;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Invalid email or password" };

  // Preserve the deep-link destination through the resolve gateway —
  // before this, every link through auth dumped users at their shell
  // root and lost their place.
  const next = safeNextPath(parsed.data.next);
  redirect(next ? `/auth/resolve?next=${encodeURIComponent(next)}` : "/auth/resolve");
}

export async function signupAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Check the fields below", fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  // Carry orgName through email confirmation so the org bootstrap also works
  // for the confirm-flow path — see /auth/callback consumes the `org` query.
  const orgName = parsed.data.orgName?.trim() || "";
  const nextPath = orgName ? `/auth/resolve?org=${encodeURIComponent(orgName)}` : "/auth/resolve";
  const emailRedirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent(nextPath)}`);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        name: parsed.data.name,
        pending_org_name: orgName || null,
        // E-17: survives the email-confirmation hop; consumed by
        // /onboarding/org's createOrgAction.
        pending_plan: parsed.data.plan ?? null,
      },
      emailRedirectTo,
    },
  });
  if (error) {
    // Duplicate email — surface as field error
    if (error.message.toLowerCase().includes("already")) {
      return {
        error: "An account with this email exists. Try signing in.",
        fieldErrors: { email: "This email is already registered" },
      };
    }
    return { error: error.message };
  }
  if (!data.user) return { error: "Signup failed: no user returned." };

  // Email confirmation required — Supabase returns no session until the user
  // clicks the link. Route to /verify-email so they aren't dumped on a
  // useless /auth/resolve that would just bounce them to /login.
  if (!data.session) {
    redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
  }

  // Auto-confirm dev mode: session is live immediately. Bootstrap the org
  // here so the user lands in /studio on first redirect.
  if (orgName) {
    await bootstrapOrgIfNeeded(supabase, orgName);
  }
  redirect("/auth/resolve");
}

// Shared helper — calls the create_org_with_owner RPC for the current
// signed-in user. No-op-safe: if the user already has a real-org membership,
// /auth/resolve will surface that org and the bootstrap is harmless if it
// runs (a second org will exist, switcher can move between).
async function bootstrapOrgIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgName: string,
): Promise<{ orgId: string; orgSlug: string } | null> {
  const trimmed = orgName.trim();
  if (!trimmed) return null;
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: Array<{ org_id: string; org_slug: string }> | null; error: { message: string } | null }>
  )("create_org_with_owner", { p_name: trimmed, p_slug: "" });
  if (error || !data || data.length === 0) {
    // Don't fail the signup over org-bootstrap — the user can re-enter the
    // name on /onboarding/org. They have an authenticated session either way.
    return null;
  }
  return { orgId: data[0]!.org_id, orgSlug: data[0]!.org_slug };
}

export async function resendVerificationAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = EmailOnlySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const emailRedirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/auth/resolve")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo },
  });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function logoutAction() {
  if (!hasSupabase) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const AcceptInviteSchema = z.object({
  token: z.string().min(8).max(128),
});

export async function acceptInviteAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = AcceptInviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid invite token" };
  const { token } = parsed.data;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    // Bounce through /login (or /signup) preserving the invite target so the
    // user lands back here after auth. The server action forces a server
    // redirect — NextResponse-style — so the client form sees a native nav.
    redirect(`/login?next=${encodeURIComponent(`/accept-invite/${token}`)}`);
  }

  // SECURITY DEFINER RPC handles validation + membership upsert + invite
  // status flip atomically. The previous direct-from-session upsert was
  // blocked by `memberships_insert_admin` (invitee isn't admin yet); the
  // RPC fences the writes so the invite-accept loop closes in one round
  // trip and stale `deleted_at != null` memberships get restored cleanly.
  type AcceptResult = {
    out_org_id: string;
    out_org_slug: string;
    out_role: string;
    out_project_id: string | null;
    out_project_role: string | null;
  };
  const { data: rpcData, error: rpcError } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: AcceptResult[] | null; error: { message: string; code?: string } | null }>
  )("accept_invite", { p_token: token });

  if (rpcError) {
    const msg = rpcError.message || "";
    if (msg.includes("invite_invalid_or_expired")) {
      return { error: "This invite is invalid or expired. Ask the org admin to resend." };
    }
    if (msg.includes("invite_email_mismatch")) {
      return { error: "This invite was addressed to a different email. Sign in with that account." };
    }
    return { error: `Couldn't join org: ${msg}` };
  }

  const result = rpcData?.[0];
  if (result) {
    await emitAudit({
      actorId: user.id,
      orgId: result.out_org_id,
      actorEmail: user.email ?? null,
      action: "auth.invite.accepted",
      targetTable: "invites",
      metadata: {
        role: result.out_role,
        project_id: result.out_project_id,
        project_role: result.out_project_role,
      },
    });
  }

  redirect("/auth/resolve");
}

export async function forgotPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = EmailOnlySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  // Route the recovery email through /auth/callback so the PKCE code is
  // exchanged for a session cookie (which `updateUser` then reads when the
  // user sets a new password on /reset-password).
  const redirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/reset-password")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) return { error: error.message };

  return { ok: true };
}

export async function magicLinkAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = EmailOnlySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const emailRedirectTo = urlFor("auth", `/auth/callback?next=${encodeURIComponent("/auth/resolve")}`);
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo,
      // Don't auto-create accounts from a magic-link flow — signup has its own
      // route with terms + name capture. If the email isn't registered we
      // surface a generic success message anyway to avoid leaking existence.
      shouldCreateUser: false,
    },
  });

  // `signInWithOtp` returns a friendly error when the email isn't registered
  // only on some configurations; swallow to avoid an account-enumeration
  // vector — the UI always claims the link was sent if validation passed.
  if (error && !error.message.toLowerCase().includes("not found")) {
    return { error: error.message };
  }

  return { ok: true };
}

const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, `At least ${PASSWORD_MIN_LENGTH} characters`)
      .max(PASSWORD_MAX_LENGTH),
    password_confirm: z.string(),
  })
  .refine((v) => v.password === v.password_confirm, {
    path: ["password_confirm"],
    message: "Passwords don't match",
  });

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = ResetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Check the fields below", fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return {
      error: "Your reset link has expired or wasn't recognized. Request a new one from Forgot password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/auth/resolve");
}
