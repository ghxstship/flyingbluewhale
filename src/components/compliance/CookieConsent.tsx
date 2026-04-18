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

type Consent = {
  essential: true;        // always on
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const COOKIE_NAME = "fbw_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;   // 1 year

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
          <DialogTitle>Cookies & privacy</DialogTitle>
          <DialogDescription>
            We use essential cookies to keep you signed in and protect your account. With your
            permission, we'd also use analytics and marketing cookies to improve the product.
          </DialogDescription>
        </DialogHeader>

        {showDetails && (
          <div className="mt-4 space-y-3 text-xs">
            <Row label="Essential" required description="Auth, security, rate limiting." />
            <ToggleRow
              label="Analytics"
              description="Aggregate usage stats. We never sell or correlate to identity."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ToggleRow
              label="Marketing"
              description="Conversion tracking for the marketing site. None inside the product."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        <DialogFooter className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-[var(--text-muted)] underline-offset-4 hover:underline"
          >
            {showDetails ? "Hide details" : "Customize"}
          </button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => decide({ analytics: false, marketing: false })}
            >
              Reject all
            </Button>
            {showDetails ? (
              <Button onClick={() => decide({ analytics, marketing })}>Save preferences</Button>
            ) : (
              <Button onClick={() => decide({ analytics: true, marketing: true })}>
                Accept all
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, required, description }: { label: string; required?: boolean; description: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="font-medium">{label}{required && " · always on"}</div>
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
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
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
          aria-label={`Toggle ${label}`}
          className="h-4 w-4"
        />
      </label>
    </div>
  );
}
