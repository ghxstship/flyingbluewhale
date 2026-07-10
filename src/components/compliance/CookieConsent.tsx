"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

type Consent = {
  essential: true; // always on
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const COOKIE_NAME = "atlvs_consent";
/** Legacy cookie name from the pre-brand-sweep era. Read-only fallback so
 * existing users don't get re-prompted for consent on the deploy that ships
 * the rename. Remove after one release once the legacy cookie has expired
 * via natural max-age rollover or been overwritten by `writeConsent`. */
const LEGACY_COOKIE_NAME = "fbw_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readConsent(): Consent | null {
  try {
    const cookies = document.cookie.split("; ");
    const m =
      cookies.find((r) => r.startsWith(`${COOKIE_NAME}=`)) ??
      cookies.find((r) => r.startsWith(`${LEGACY_COOKIE_NAME}=`));
    if (!m) return null;
    const value = decodeURIComponent(m.slice(m.indexOf("=") + 1));
    return JSON.parse(value) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(c))}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  // Drop the legacy cookie so it doesn't shadow the canonical one on
  // future reads (cookie order is implementation-defined).
  document.cookie = `${LEGACY_COOKIE_NAME}=; max-age=0; path=/`;
  // Expose to window so analytics scripts can gate
  (window as Window & { __consent?: Consent }).__consent = c;
  window.dispatchEvent(new CustomEvent("consentchange", { detail: c }));
}

/**
 * E-16: non-blocking bottom consent banner (Linear/Stripe pattern) replacing
 * the full-screen blocking modal. The page stays fully usable behind it.
 * Dismissing (X or Escape) is an explicit essential-only decision and is
 * PERSISTED — the banner never re-opens on the next navigation. "Manage
 * settings" opens the detailed dialog with per-category toggles.
 */
export function CookieConsent() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);

  React.useEffect(() => {
    if (!readConsent()) {
      // Defer slightly so it doesn't block first paint
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = React.useCallback((opts: { analytics: boolean; marketing: boolean }) => {
    writeConsent({
      essential: true,
      analytics: opts.analytics,
      marketing: opts.marketing,
      decidedAt: new Date().toISOString(),
    });
    setDetailsOpen(false);
    setOpen(false);
  }, []);

  // ESC anywhere while the banner shows = dismiss = essential-only, persisted.
  React.useEffect(() => {
    if (!open || detailsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") decide({ analytics: false, marketing: false });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, detailsOpen, decide]);

  if (!open) return null;

  return (
    <>
      <section
        aria-label={t("cookieConsent.title", undefined, "Cookies & privacy")}
        className="fixed inset-x-0 bottom-0 z-[60] border-t border-[var(--p-border)] bg-[var(--p-surface)] p-4 shadow-[var(--p-elev-xl,0_-4px_24px_rgba(0,0,0,0.12))] print:hidden"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1 basis-72">
            <div className="text-sm font-semibold">{t("cookieConsent.title", undefined, "Cookies & privacy")}</div>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "cookieConsent.description",
                undefined,
                "We use essential cookies to keep you signed in and protect your account. With your permission, we'd also use analytics and marketing cookies to improve the product.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="text-xs text-[var(--p-text-2)] underline-offset-4 hover:underline"
            >
              {t("cookieConsent.manageSettings", undefined, "Manage settings")}
            </button>
            <Button variant="ghost" size="sm" onClick={() => decide({ analytics: false, marketing: false })}>
              {t("cookieConsent.rejectAll", undefined, "Reject All")}
            </Button>
            <Button size="sm" onClick={() => decide({ analytics: true, marketing: true })}>
              {t("cookieConsent.acceptAll", undefined, "Accept All")}
            </Button>
            <button
              type="button"
              onClick={() => decide({ analytics: false, marketing: false })}
              aria-label={t("cookieConsent.dismiss", undefined, "Dismiss and continue with essential cookies only")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)]"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t("cookieConsent.title", undefined, "Cookies & privacy")}</DialogTitle>
            <DialogDescription>
              {t(
                "cookieConsent.description",
                undefined,
                "We use essential cookies to keep you signed in and protect your account. With your permission, we'd also use analytics and marketing cookies to improve the product.",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 text-xs">
            <Row
              label={t("cookieConsent.essential.label", undefined, "Essential")}
              required
              requiredSuffix={t("cookieConsent.essential.alwaysOn", undefined, " · always on")}
              description={t("cookieConsent.essential.description", undefined, "Auth, security, rate limiting.")}
            />
            <ToggleRow
              label={t("cookieConsent.analytics.label", undefined, "Analytics")}
              description={t(
                "cookieConsent.analytics.description",
                undefined,
                "Aggregate usage stats. We never sell or correlate to identity.",
              )}
              toggleAria={t(
                "cookieConsent.toggle",
                { label: t("cookieConsent.analytics.label", undefined, "Analytics") },
                "Toggle {label}",
              )}
              checked={analytics}
              onChange={setAnalytics}
            />
            <ToggleRow
              label={t("cookieConsent.marketing.label", undefined, "Marketing")}
              description={t(
                "cookieConsent.marketing.description",
                undefined,
                "Conversion tracking for the marketing site. None inside the product.",
              )}
              toggleAria={t(
                "cookieConsent.toggle",
                { label: t("cookieConsent.marketing.label", undefined, "Marketing") },
                "Toggle {label}",
              )}
              checked={marketing}
              onChange={setMarketing}
            />
          </div>

          <DialogFooter className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => decide({ analytics: false, marketing: false })}>
              {t("cookieConsent.rejectAll", undefined, "Reject All")}
            </Button>
            <Button onClick={() => decide({ analytics, marketing })}>
              {t("cookieConsent.savePreferences", undefined, "Save Preferences")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  label,
  required,
  requiredSuffix,
  description,
}: {
  label: string;
  required?: boolean;
  requiredSuffix?: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">
          {label}
          {required && requiredSuffix}
        </div>
        <div className="text-[var(--p-text-2)]">{description}</div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  toggleAria,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  toggleAria: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-[var(--p-text-2)]">{description}</div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked)}
          aria-label={toggleAria}
          className="h-4 w-4"
        />
      </label>
    </div>
  );
}
