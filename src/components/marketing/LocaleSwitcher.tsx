"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/config";

// Native-name labels — the universally-correct way to expose language
// options. A French user reading an English site should still recognize
// "Français" in their own language; a Japanese user reading en-US should
// still see "日本語" not "Japanese". Industry-standard practice.
const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ja: "日本語",
  ar: "العربية",
};

/**
 * Language switcher for the marketing header.
 *
 * State model:
 *   1. Active locale resolved server-side via `getRequestLocale()` and
 *      rendered into `<html lang dir>`. The cookie `locale` is the
 *      authoritative write target on the client.
 *   2. `setLocale` sets the cookie with a 1-year max-age + same-site=lax.
 *   3. `router.refresh()` re-runs the server tree so every `<t />` call
 *      re-renders with the new locale. No full page reload — RSC payload
 *      only.
 *
 * A11y: exposed as a proper radiogroup via Radix. Globe icon is decorative,
 * screen readers hear "Change language" from the aria-label on the trigger.
 */
function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  const raw = match ? decodeURIComponent(match[1]) : null;
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function LocaleSwitcher({ current }: { current?: Locale } = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Initialize from the cookie on the client so the menu's checked state is
  // correct on first paint even when a `current` prop isn't plumbed.
  const [active, setActive] = useState<Locale>(() => current ?? DEFAULT_LOCALE);

  useEffect(() => {
    if (!current) setActive(readLocaleCookie());
  }, [current]);

  function pick(next: Locale) {
    if (next === active) return;
    setActive(next);
    // 1-year cookie; `lax` keeps it safe from CSRF while still sending on
    // top-level navigations so the server picks it up on the next paint.
    document.cookie = `locale=${encodeURIComponent(next)}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="btn btn-ghost btn-sm inline-flex items-center gap-1.5"
          aria-label="Change language"
          disabled={isPending}
        >
          <Globe size={14} aria-hidden="true" />
          <span className="hidden lg:inline">{active.toUpperCase()}</span>
          <ChevronDown size={12} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="surface-raised elevation-2 z-50 min-w-[11rem] rounded-lg border border-[var(--border-color)] p-1 text-sm"
        >
          <DropdownMenu.Label className="px-2 pb-1 pt-0.5 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Language
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={active} onValueChange={(v) => pick(v as Locale)}>
            {SUPPORTED_LOCALES.map((loc) => (
              <DropdownMenu.RadioItem
                key={loc}
                value={loc}
                className="relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-[var(--bg-secondary)] focus-visible:bg-[var(--bg-secondary)] data-[state=checked]:font-medium"
                data-locale={loc}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <DropdownMenu.ItemIndicator>
                    <Check size={14} aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span>{LOCALE_LABELS[loc]}</span>
                <span className="ml-auto text-xs uppercase tracking-wider text-[var(--text-muted)]">{loc}</span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
