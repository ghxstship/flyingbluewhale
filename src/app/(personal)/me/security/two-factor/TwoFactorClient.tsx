"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Download, KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/i18n/format";
import { enrollMfaAction, verifyEnrollmentAction, unenrollMfaAction, regenerateRecoveryCodesAction } from "./actions";

type FactorRow = {
  id: string;
  status: "verified" | "unverified";
  friendlyName: string | null;
  createdAt: string;
};

type EnrollState = {
  factorId: string;
  secret: string;
  qrSvg: string;
  uri: string;
};

export function TwoFactorClient({ initialFactors }: { initialFactors: FactorRow[] }) {
  const [factors, setFactors] = useState<FactorRow[]>(initialFactors);
  const [enroll, setEnroll] = useState<EnrollState | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const verifiedTotp = factors.find((f) => f.status === "verified");

  function startEnroll() {
    startTransition(async () => {
      const result = await enrollMfaAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setEnroll({
        factorId: result.factorId,
        secret: result.secret,
        qrSvg: result.qrSvg,
        uri: result.uri,
      });
      setCode("");
    });
  }

  function cancelEnroll() {
    if (!enroll) return;
    startTransition(async () => {
      await unenrollMfaAction(enroll.factorId);
      setEnroll(null);
      setCode("");
    });
  }

  function submitVerification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enroll) return;
    startTransition(async () => {
      const result = await verifyEnrollmentAction(enroll.factorId, code);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      // Surface a verified factor immediately — the page will refresh on its
      // own next nav, but we don't want the user to see "no factor" while we
      // also display recovery codes.
      setFactors((prev) => [
        ...prev,
        {
          id: enroll.factorId,
          status: "verified",
          friendlyName: null,
          createdAt: new Date().toISOString(),
        },
      ]);
      setEnroll(null);
      setRecoveryCodes(result.recoveryCodes);
      toast.success("Authenticator app added");
    });
  }

  function removeFactor(id: string) {
    if (!confirm("Remove this authenticator? You'll need to re-enroll to sign in with TOTP.")) return;
    startTransition(async () => {
      const result = await unenrollMfaAction(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setFactors((prev) => prev.filter((f) => f.id !== id));
      setRecoveryCodes(null);
      toast.success("Removed");
    });
  }

  function regenerate() {
    if (!confirm("Generating new codes invalidates all existing recovery codes. Continue?")) return;
    startTransition(async () => {
      const result = await regenerateRecoveryCodesAction();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setRecoveryCodes(result.recoveryCodes);
      toast.success("New recovery codes generated");
    });
  }

  // ────────────────────────────────────────────────────
  // Recovery-code reveal pane (post-enroll or post-regenerate)
  // ────────────────────────────────────────────────────
  if (recoveryCodes) {
    return <RecoveryCodesPanel codes={recoveryCodes} onDone={() => setRecoveryCodes(null)} />;
  }

  // ────────────────────────────────────────────────────
  // Enrollment pane (QR + verify)
  // ────────────────────────────────────────────────────
  if (enroll) {
    return (
      <div className="surface space-y-5 p-6">
        <div>
          <div className="text-sm font-semibold">Scan this QR code</div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Use Google Authenticator, 1Password, Authy, or any TOTP-compatible app.
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 md:flex-row md:items-center">
          {enroll.qrSvg ? (
            <div className="rounded bg-white p-3">
              {/*
               * Server returns a sanitized data:image/svg+xml URI. <img>
               * loads it in passive image mode — scripts and handlers are
               * ignored by the browser even if the SVG carried them.
               */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enroll.qrSvg} alt="Two-factor enrollment QR code" width={240} height={240} />
            </div>
          ) : (
            <div className="surface-inset flex h-[252px] w-[252px] items-center justify-center text-xs text-[var(--text-muted)]">
              QR unavailable — paste the secret below
            </div>
          )}

          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xs font-semibold tracking-[0.18em] text-[var(--text-muted)] uppercase">
                Or paste this secret
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="surface-inset flex-1 rounded px-3 py-2 font-mono text-xs break-all">
                  {enroll.secret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(enroll.secret);
                    toast.success("Secret copied");
                  }}
                  aria-label="Copy secret"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submitVerification} className="space-y-3 border-t border-[var(--border-color)] pt-5">
          <Input
            label="Enter the 6-digit code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123 456"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={cancelEnroll} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" loading={pending} disabled={code.length !== 6}>
              Verify and enable
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ────────────────────────────────────────────────────
  // Default pane — list factors + "add" CTA
  // ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="surface">
        {factors.length === 0 ? (
          <EmptyState
            title="No Authenticator Enrolled"
            description="Add an app like Google Authenticator, 1Password, or Authy to require a second factor at sign-in."
            icon={<ShieldCheck size={32} />}
          />
        ) : (
          <ul className="divide-y divide-[var(--border-color)]">
            {factors.map((f) => (
              <li key={f.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={16} className="text-[var(--color-success)]" aria-hidden="true" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{f.friendlyName ?? "Authenticator app"}</span>
                      <Badge variant={f.status === "verified" ? "success" : "warning"}>
                        {f.status === "verified" ? "Active" : "Pending"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      Added {formatRelative(f.createdAt)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFactor(f.id)}
                  aria-label="Remove authenticator"
                  className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--color-error)]"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center justify-end gap-2 border-t border-[var(--border-color)] p-3">
          <Button onClick={startEnroll} loading={pending} size="sm">
            <ShieldCheck size={12} className="me-1" aria-hidden="true" />
            {factors.length === 0 ? "Add authenticator" : "Add another"}
          </Button>
        </div>
      </div>

      {verifiedTotp && (
        <div className="surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-[var(--text-muted)]" aria-hidden="true" />
                <span className="text-sm font-semibold">Recovery Codes</span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Single-use codes for when you lose access to your authenticator. Generating new codes invalidates all
                existing codes.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={regenerate} loading={pending}>
              Generate new codes
            </Button>
          </div>
        </div>
      )}

      <Alert kind="info" hideIcon>
        <span className="text-xs">
          Recovery codes are stored hashed — we can show them to you exactly once. Save them in a password manager
          before leaving this page.
        </span>
      </Alert>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Recovery codes display — shown immediately after verify or regenerate.
// ────────────────────────────────────────────────────────────────────

function RecoveryCodesPanel({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  function copy() {
    void navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Recovery codes copied");
  }

  function download() {
    const blob = new Blob([codes.join("\n") + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "atlvs-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="surface space-y-5 p-6">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-[var(--org-primary)]" aria-hidden="true" />
        <h2 className="text-sm font-semibold tracking-[0.18em] uppercase">Save Your Recovery Codes</h2>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Store these somewhere safe. Each code works once — for example, if you lose your authenticator. We hash codes on
        save, so this is the only time you&apos;ll see them.
      </p>

      <ul className="grid grid-cols-2 gap-2 font-mono text-sm" aria-label="Recovery codes">
        {codes.map((c) => (
          <li key={c} className="surface-inset rounded px-3 py-2 tracking-wider">
            {c}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={copy}>
            <Copy size={12} className="me-1" aria-hidden="true" /> Copy
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={download}>
            <Download size={12} className="me-1" aria-hidden="true" /> Download
          </Button>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 accent-[var(--org-primary)]"
          />
          I&apos;ve saved these codes
        </label>
      </div>

      <div className="flex justify-end">
        <Button onClick={onDone} disabled={!confirmed}>
          Done
        </Button>
      </div>
    </div>
  );
}
