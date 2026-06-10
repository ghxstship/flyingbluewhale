"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { SUPPORTED_LOCALES, isSupportedLocale, type Locale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { setLocalePreferences } from "@/lib/i18n/actions";
import { useLocale, useT } from "@/lib/i18n/LocaleProvider";
import { track } from "@/lib/marketing-telemetry";

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
  const raw = match?.[1] ? decodeURIComponent(match[1]) : null;
  return isSupportedLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function LocaleSwitcher({ current }: { current?: Locale } = {}) {
  const router = useRouter();
  const t = useT();
  // The provider snapshot is the SSOT — server-resolved (cookie → header →
  // DB → org default → baseline) and pushed into context once per request,
  // so the checked state is correct on first paint without a hydration
  // flash. Falls back to cookie/default outside the provider for legacy
  // call sites.
  const { locale: providerLocale } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<Locale>(() => current ?? providerLocale ?? DEFAULT_LOCALE);

  useEffect(() => {
    if (current) return;
    if (providerLocale && providerLocale !== active) setActive(providerLocale);
    else if (!providerLocale) setActive(readLocaleCookie());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, providerLocale]);

  function pick(next: Locale) {
    if (next === active) return;
    setActive(next);
    // Detect the browser timezone and ship it alongside the locale change so
    // first-time users get sensible date rendering without a separate dialog.
    const detectedTz =
      typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || undefined : undefined;
    track("marketing.locale.switched", { from: active, to: next });
    startTransition(async () => {
      // Server action: writes cookie + persists to `users.preferred_locale`
      // for authed callers, then revalidates the layout so `<html lang dir>`
      // updates without a full reload.
      await setLocalePreferences({ locale: next, timezone: detectedTz });
      router.refresh();
    });
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="ps-btn ps-btn--ghost ps-btn--sm inline-flex items-center gap-1.5"
          aria-label={t("footerUtility.changeLanguage")}
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
          className="surface z-50 min-w-[11rem] rounded-lg border border-[var(--p-border)] p-1 text-sm"
        >
          <DropdownMenu.Label className="px-2 pt-0.5 pb-1 text-xs font-medium tracking-wider text-[var(--p-text-2)] uppercase">
            {t("marketing.header.language")}
          </DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={active} onValueChange={(v) => pick(v as Locale)}>
            {SUPPORTED_LOCALES.map((loc) => (
              <DropdownMenu.RadioItem
                key={loc}
                value={loc}
                className="relative flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-[var(--p-surface)] focus-visible:bg-[var(--p-surface)] data-[state=checked]:font-medium"
                data-locale={loc}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  <DropdownMenu.ItemIndicator>
                    <Check size={14} aria-hidden="true" />
                  </DropdownMenu.ItemIndicator>
                </span>
                <span>{LOCALE_LABELS[loc]}</span>
                <span className="ms-auto text-xs tracking-wider text-[var(--p-text-2)] uppercase">{loc}</span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
