"use client";

import * as React from "react";
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

export function CookieConsent() {
  const t = useT();
  const [open, setOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);

  React.useEffect(() => {
    if (!readConsent()) {
      // Defer slightly so it doesn't block first paint
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  function decide(opts: { analytics: boolean; marketing: boolean }) {
    writeConsent({
      essential: true,
      analytics: opts.analytics,
      marketing: opts.marketing,
      decidedAt: new Date().toISOString(),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="md" hideCloseButton>
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

        {showDetails && (
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
        )}

        <DialogFooter className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-[var(--p-text-2)] underline-offset-4 hover:underline"
          >
            {showDetails
              ? t("cookieConsent.hideDetails", undefined, "Hide Details")
              : t("cookieConsent.customize", undefined, "Customize")}
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => decide({ analytics: false, marketing: false })}>
              {t("cookieConsent.rejectAll", undefined, "Reject All")}
            </Button>
            {showDetails ? (
              <Button onClick={() => decide({ analytics, marketing })}>
                {t("cookieConsent.savePreferences", undefined, "Save Preferences")}
              </Button>
            ) : (
              <Button onClick={() => decide({ analytics: true, marketing: true })}>
                {t("cookieConsent.acceptAll", undefined, "Accept All")}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
