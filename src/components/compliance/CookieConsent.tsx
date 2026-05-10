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

const COOKIE_NAME = "fbw_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function readConsent(): Consent | null {
  try {
    const m = document.cookie.split("; ").find((r) => r.startsWith(`${COOKIE_NAME}=`));
    if (!m) return null;
    const value = decodeURIComponent(m.slice(COOKIE_NAME.length + 1));
    return JSON.parse(value) as Consent;
  } catch {
    return null;
  }
}

function writeConsent(c: Consent) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(c))}; max-age=${COOKIE_MAX_AGE}; path=/; samesite=lax`;
  // Expose to window so analytics scripts can gate
  (window as Window & { __consent?: Consent }).__consent = c;
  window.dispatchEvent(new CustomEvent("consentchange", { detail: c }));
}

export function CookieConsent() {
  const [open, setOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
  const t = useT();

  React.useEffect(() => {
    if (!readConsent()) {
      // Defer slightly so it doesn't block first paint
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
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
          <DialogTitle>{t("cookies.title")}</DialogTitle>
          <DialogDescription>{t("cookies.description")}</DialogDescription>
        </DialogHeader>

        {showDetails && (
          <div className="mt-4 space-y-3 text-xs">
            <Row
              label={t("cookies.essential")}
              required
              alwaysOnLabel={t("cookies.alwaysOn")}
              description={t("cookies.essentialDescription")}
            />
            <ToggleRow
              label={t("cookies.analytics")}
              description={t("cookies.analyticsDescription")}
              checked={analytics}
              onChange={setAnalytics}
              toggleAriaLabel={t("cookies.toggleLabel", { category: t("cookies.analytics") })}
            />
            <ToggleRow
              label={t("cookies.marketing")}
              description={t("cookies.marketingDescription")}
              checked={marketing}
              onChange={setMarketing}
              toggleAriaLabel={t("cookies.toggleLabel", { category: t("cookies.marketing") })}
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-[var(--text-muted)] underline-offset-4 hover:underline"
          >
            {showDetails ? t("cookies.hideDetails") : t("cookies.customize")}
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => decide({ analytics: false, marketing: false })}>
              {t("cookies.rejectAll")}
            </Button>
            {showDetails ? (
              <Button onClick={() => decide({ analytics, marketing })}>{t("cookies.savePreferences")}</Button>
            ) : (
              <Button onClick={() => decide({ analytics: true, marketing: true })}>{t("cookies.acceptAll")}</Button>
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
  alwaysOnLabel,
  description,
}: {
  label: string;
  required?: boolean;
  alwaysOnLabel?: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">
          {label}
          {required && alwaysOnLabel && ` · ${alwaysOnLabel}`}
        </div>
        <div className="text-[var(--text-muted)]">{description}</div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  toggleAriaLabel,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  toggleAriaLabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-[var(--text-muted)]">{description}</div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.currentTarget.checked)}
          aria-label={toggleAriaLabel ?? label}
          className="h-4 w-4"
        />
      </label>
    </div>
  );
}
