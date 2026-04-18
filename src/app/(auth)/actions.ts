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

  const supabase = await createClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });
  if (error) return { error: error.message };

  return { ok: true };
}
