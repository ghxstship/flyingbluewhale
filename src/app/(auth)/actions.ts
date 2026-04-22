"use server";

import { redirect } from "next/navigation";
import { z, type ZodIssue } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { FormState } from "@/components/FormShell";

// NOTE: Next.js server-action files (`"use server"`) cannot re-export types —
// every export becomes an RPC endpoint, and a type re-export crashes at runtime
// (ReferenceError: FormState is not defined). Form components must import
// FormState from @/components/FormShell directly.

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid work email"),
  password: z.string().min(8, "At least 8 characters").max(128),
  orgName: z.string().max(120).optional(),
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
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password" };

  redirect("/auth/resolve");
}

export async function signupAction(_: FormState, formData: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase not configured." };
  const parsed = SignupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Check the fields below", fieldErrors: zodToFieldErrors(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) {
    // Duplicate email — surface as field error
    if (error.message.toLowerCase().includes("already")) {
      return {
        error: "An account with this email exists — try signing in",
        fieldErrors: { email: "This email is already registered" },
      };
    }
    return { error: error.message };
  }
  if (!data.user) return { error: "Signup failed — no user returned." };

  redirect("/auth/resolve");
}

export async function logoutAction() {
  if (!hasSupabase) redirect("/");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
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

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/resolve")}`;
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
    password: z.string().min(8, "At least 8 characters").max(128),
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
      error:
        "Your reset link has expired or wasn't recognized. Request a new one from Forgot password.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  redirect("/auth/resolve");
}
