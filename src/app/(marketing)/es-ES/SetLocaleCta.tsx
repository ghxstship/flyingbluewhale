"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { setLocalePreferences } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n/config";

/**
 * E-13: honest i18n posture. There is no per-URL localized mirror of the full
 * site — but the whole product IS translated via the locale preference (the
 * same mechanism as the header's LocaleSwitcher). This CTA sets the
 * preference and sends the visitor into the fully translated site instead of
 * letting every link silently exit to English.
 */
export function SetLocaleCta({ locale, label, note }: { locale: Locale; label: string; note: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="max-w-xl text-sm text-[var(--p-text-2)]">{note}</p>
        <Button
          variant="secondary"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              const detectedTz =
                typeof Intl !== "undefined"
                  ? Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
                  : undefined;
              await setLocalePreferences({ locale, timezone: detectedTz });
              router.push("/");
              router.refresh();
            })
          }
        >
          <Globe size={14} aria-hidden="true" />
          {label}
        </Button>
      </div>
    </div>
  );
}
