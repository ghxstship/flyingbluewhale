"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import type { GuidePersona } from "@/lib/supabase/types";

export function UnlockForm({ slug, persona, from }: { slug: string; persona: GuidePersona; from: string }) {
  const t = useT();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!code.trim()) {
          setError(t("p.shared.guide.unlock.error.empty", undefined, "Enter your access code."));
          return;
        }
        setError(null);
        startTransition(async () => {
          try {
            const res = await fetch("/api/v1/guides/unlock", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ slug, persona, code: code.trim() }),
            });
            const json = (await res.json().catch(() => ({}))) as {
              ok?: boolean;
              error?: { message?: string };
              data?: { redirect?: string };
            };
            if (!res.ok || !json.ok) {
              const msg =
                res.status === 429
                  ? t("p.shared.guide.unlock.error.rateLimited", undefined, "Too many attempts. Try again in a minute.")
                  : (json.error?.message ?? t("p.shared.guide.unlock.error.invalid", undefined, "Invalid code."));
              setError(msg);
              return;
            }
            // Server set the cookie; client just navigates back to the
            // requested guide.
            const target = json.data?.redirect ?? from;
            router.replace(target);
            router.refresh();
          } catch {
            setError(t("p.shared.guide.unlock.error.network", undefined, "Network error. Try again."));
          }
        });
      }}
      className="space-y-3"
    >
      <Input
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("p.shared.guide.unlock.placeholder", undefined, "XXXX-XXXX-XX")}
        autoComplete="one-time-code"
        spellCheck={false}
        className="font-mono tracking-wider uppercase"
        aria-label={t("p.shared.guide.unlock.aria", undefined, "Access code")}
      />
      {error && <div className="text-sm text-[var(--p-danger)]">{error}</div>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending
          ? t("p.shared.guide.unlock.submitting", undefined, "Unlocking…")
          : t("p.shared.guide.unlock.submit", undefined, "Unlock guide")}
      </Button>
    </form>
  );
}
