"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { createClient } from "@/lib/supabase/client";

export function TalentOnboardForm({ token, prefillEmail }: { token: string; prefillEmail: string }) {
  const [email] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !password) return;
    setError(null);
    startTransition(async () => {
      const supabase = createClient();

      // Create or sign in the Supabase auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });

      if (signUpError && !signUpError.message.includes("already registered")) {
        setError(signUpError.message);
        return;
      }

      // If already registered, sign them in instead
      if (signUpError?.message.includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setError(signInError.message); return; }
      }

      // Mark the invite token as used
      const res = await fetch(`/api/v1/talent-invite/${token}/consume`, { method: "POST" });
      if (!res.ok) {
        setError("Could not activate your invite. Please contact support.");
        return;
      }

      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="surface space-y-4 p-8 text-center">
        <p className="text-2xl">🎉</p>
        <h2 className="text-lg font-semibold">You&apos;re in!</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Your account is set up. Complete your talent profile to start applying for opportunities.
        </p>
        <Button href="/me/talent">Go to my profile</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface space-y-4 p-6">
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      <Input label="Email" type="email" value={email} readOnly hint="Set by your invite — cannot be changed." />
      <Input
        label="Create a password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        hint="At least 8 characters."
      />
      {error && <Alert kind="error">{error}</Alert>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account & join"}
      </Button>
      <p className="text-center text-[11px] text-[var(--text-muted)]">
        Already have an account?{" "}
        <a href="/login" className="underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
