"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/server";
import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/i18n/format";

type Credential = {
  id: string;
  device_name: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function PasskeyManager() {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [adding, setAdding] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
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
        throw new Error(j?.error?.message ?? "Couldn't start registration");
      }
      const optsJson = (await optsRes.json()) as { ok: boolean; data: PublicKeyCredentialCreationOptionsJSON };
      const attestation = await startRegistration({ optionsJSON: optsJson.data });

      const deviceName =
        prompt("Name this device (optional):", navigator.userAgent.split("(")[0].trim()) ?? null;

      const verifyRes = await fetch("/api/v1/auth/webauthn/register/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ response: attestation, deviceName }),
      });
      if (!verifyRes.ok) {
        const j = await verifyRes.json().catch(() => ({}));
        throw new Error(j?.error?.message ?? "Registration failed");
      }
      toast.success("Passkey added");
      void refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't add passkey";
      if (!msg.toLowerCase().includes("aborted")) toast.error(msg);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this passkey?")) return;
    try {
      const res = await fetch(`/api/v1/auth/webauthn/credentials?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Removed");
      void refresh();
    } catch {
      toast.error("Couldn't remove");
    }
  }

  if (!supported) {
    return (
      <div className="surface p-4 text-xs text-[var(--text-muted)]">
        Your browser doesn&apos;t support passkeys yet. Use a modern Chrome, Safari, Edge, or Firefox.
      </div>
    );
  }

  return (
    <div className={creds.length === 0 ? "" : "surface divide-y divide-[var(--border-color)]"}>
      {creds.length === 0 ? (
        <EmptyState
          title="No passkeys yet"
          description="Register a passkey to sign in without a password."
          icon={<Fingerprint size={32} />}
        />
      ) : (
        creds.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Fingerprint size={16} className="text-[var(--org-primary)]" aria-hidden="true" />
              <div>
                <div className="text-sm font-medium">{c.device_name ?? "Unnamed device"}</div>
                <div className="text-[10px] text-[var(--text-muted)]">
                  Added {formatRelative(c.created_at)}
                  {c.last_used_at && ` · last used ${formatRelative(c.last_used_at)}`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(c.id)}
              aria-label="Remove passkey"
              className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--color-error)]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
      <div className="flex items-center justify-end gap-2 p-3">
        <Button onClick={add} loading={adding} size="sm">
          <Plus size={12} className="me-1" aria-hidden="true" /> Add passkey
        </Button>
      </div>
    </div>
  );
}
