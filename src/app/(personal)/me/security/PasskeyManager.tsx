"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/i18n/format";
import { useT } from "@/lib/i18n/LocaleProvider";

type Credential = {
  id: string;
  device_name: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function PasskeyManager() {
  const t = useT();
  const [creds, setCreds] = useState<Credential[]>([]);
  const [adding, setAdding] = useState(false);
  // Lazy initializer — `browserSupportsWebAuthn` is browser-only, so we
  // can run it once on mount via the lazy-state form rather than calling
  // setState inside an effect (which triggers cascading renders).
  const [supported] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return browserSupportsWebAuthn();
    } catch {
      return true;
    }
  });

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    try {
      const res = await fetch("/api/v1/auth/webauthn/credentials");
      const json = (await res.json()) as { ok: boolean; data?: { credentials: Credential[] } };
      if (json.ok && json.data) setCreds(json.data.credentials);
    } catch {
      /* ignore */
    }
  }

  async function add() {
    setAdding(true);
    try {
      const optsRes = await fetch("/api/v1/auth/webauthn/register/options", { method: "POST" });
      if (!optsRes.ok) {
        const j = await optsRes.json().catch(() => ({}));
        throw new Error(
          j?.error?.message ??
            t("me.security.passkeys.errors.startRegistration", undefined, "Couldn't start registration"),
        );
      }
      const optsJson = (await optsRes.json()) as { ok: boolean; data: PublicKeyCredentialCreationOptionsJSON };
      const attestation = await startRegistration({ optionsJSON: optsJson.data });

      const deviceName =
        prompt(
          t("me.security.passkeys.prompts.deviceName", undefined, "Name this device (optional):"),
          navigator.userAgent.split("(")[0]!.trim(),
        ) ?? null;

      const verifyRes = await fetch("/api/v1/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response: attestation, deviceName }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(
          j?.error?.message ?? t("me.security.passkeys.errors.registrationFailed", undefined, "Registration failed"),
        );
      }
      toast.success(t("me.security.passkeys.toasts.added", undefined, "Passkey added"));
      void refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("me.security.passkeys.errors.addFailed", undefined, "Couldn't add passkey");
      if (!msg.toLowerCase().includes("aborted")) toast.error(msg);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("me.security.passkeys.prompts.removeConfirm", undefined, "Remove this passkey?"))) return;
    try {
      const res = await fetch(`/api/v1/auth/webauthn/credentials?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success(t("me.security.passkeys.toasts.removed", undefined, "Removed"));
      void refresh();
    } catch {
      toast.error(t("me.security.passkeys.errors.removeFailed", undefined, "Couldn't remove"));
    }
  }

  if (!supported) {
    return (
      <div className="surface p-4 text-xs text-[var(--p-text-2)]">
        {t(
          "me.security.passkeys.unsupported",
          undefined,
          "Your browser doesn't support passkeys yet. Use a modern Chrome, Safari, Edge, or Firefox.",
        )}
      </div>
    );
  }

  return (
    <div className={creds.length === 0 ? "" : "surface divide-y divide-[var(--p-border)]"}>
      {creds.length === 0 ? (
        <EmptyState
          title={t("me.security.passkeys.empty.title", undefined, "No Passkeys Yet")}
          description={t(
            "me.security.passkeys.empty.description",
            undefined,
            "Register a passkey to sign in without a password.",
          )}
          icon={<Fingerprint size={32} />}
        />
      ) : (
        creds.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Fingerprint size={16} className="text-[var(--p-accent)]" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium">
                  {c.device_name ?? t("me.security.passkeys.unnamedDevice", undefined, "Unnamed device")}
                </div>
                <div className="text-[10px] text-[var(--p-text-2)]">
                  {t(
                    "me.security.passkeys.added",
                    { when: formatRelative(c.created_at) },
                    `Added ${formatRelative(c.created_at)}`,
                  )}
                  {c.last_used_at &&
                    ` ${t("me.security.passkeys.lastUsed", { when: formatRelative(c.last_used_at) }, `· last used ${formatRelative(c.last_used_at)}`)}`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label={t("me.security.passkeys.removeAria", undefined, "Remove passkey")}
              className="rounded p-1 text-[var(--p-text-2)] hover:text-[var(--p-danger)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
      <div className="flex items-center justify-end gap-2 p-3">
        <Button onClick={add} loading={adding} size="sm">
          <Plus size={12} className="me-1" aria-hidden="true" />{" "}
          {t("me.security.passkeys.addButton", undefined, "Add passkey")}
        </Button>
      </div>
    </div>
  );
}
