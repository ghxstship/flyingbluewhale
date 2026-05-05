"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Link2, Lock, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import type { CreateShareLinkInput, ShareLink } from "@/lib/share/types";

/**
 * Reusable Share dialog. Shows existing links for a (resource_table,
 * resource_id) pair and lets the caller mint a new one with optional
 * passcode, expiry, role, and max-uses.
 *
 * Wire it from any resource detail page:
 *   <ShareDialog resourceTable="view_configs" resourceId={view.id} />
 *
 * The dialog calls /api/v1/share-links for create / list / revoke; auth is
 * enforced by `withAuth` + `assertCapability("projects:write")` on the
 * server. Anyone below manager level will see the API return 403 — the
 * dialog surfaces that as an inline error.
 */

type ExpiryPreset = "1h" | "24h" | "7d" | "30d" | "never";

const EXPIRY_DAYS: Record<ExpiryPreset, number | null> = {
  "1h": 1 / 24,
  "24h": 1,
  "7d": 7,
  "30d": 30,
  never: null,
};

const EXPIRY_LABEL: Record<ExpiryPreset, string> = {
  "1h": "1 hour",
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  never: "Never expires",
};

type ShareDialogProps = {
  resourceTable: string;
  resourceId: string;
  /** Optional: existing links so the dialog hydrates immediately. Otherwise fetches. */
  initialLinks?: ShareLink[];
  /** Display label for the resource (e.g. project name). */
  resourceLabel?: string;
  /** Render-prop trigger; falls back to a default Share button. */
  children?: React.ReactNode;
};

export function ShareDialog({ resourceTable, resourceId, initialLinks, resourceLabel, children }: ShareDialogProps) {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>(initialLinks ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCreatedUrl, setJustCreatedUrl] = useState<string | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [expiry, setExpiry] = useState<ExpiryPreset>("7d");
  const [passcode, setPasscode] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [role, setRole] = useState<"viewer" | "commenter">("viewer");

  // Hydrate when opened (only if no initial links were passed).
  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/v1/share-links?resourceTable=${encodeURIComponent(resourceTable)}&resourceId=${encodeURIComponent(resourceId)}`,
      );
      const json = (await r.json()) as { ok: boolean; data?: { links: ShareLink[] }; error?: { message: string } };
      if (!r.ok || !json.ok) {
        setError(json.error?.message ?? "Failed to load links");
        return;
      }
      setLinks(json.data?.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load links");
    } finally {
      setLoading(false);
    }
  }, [resourceTable, resourceId]);

  useEffect(() => {
    if (open && !initialLinks) {
      void hydrate();
    }
  }, [open, initialLinks, hydrate]);

  const onCreate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setJustCreatedUrl(null);
    try {
      const body: CreateShareLinkInput = {
        resourceTable,
        resourceId,
        role,
        label: label.trim() || undefined,
        passcode: passcode.trim() || undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresInDays: EXPIRY_DAYS[expiry] ?? undefined,
      };
      const r = await fetch("/api/v1/share-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await r.json()) as {
        ok: boolean;
        data?: { id: string; url: string; link: ShareLink };
        error?: { message: string };
      };
      if (!r.ok || !json.ok || !json.data) {
        setError(json.error?.message ?? "Failed to create link");
        return;
      }
      setJustCreatedUrl(json.data.url);
      setLinks((prev) => [json.data!.link, ...prev]);
      setLabel("");
      setPasscode("");
      setMaxUses("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create link");
    } finally {
      setLoading(false);
    }
  }, [expiry, label, maxUses, passcode, resourceId, resourceTable, role]);

  const onRevoke = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/v1/share-links/${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = (await r.json()) as { ok: boolean; error?: { message: string } };
      if (!r.ok || !json.ok) {
        setError(json.error?.message ?? "Failed to revoke");
        return;
      }
      setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, revoked_at: new Date().toISOString() } : l)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke");
    } finally {
      setLoading(false);
    }
  }, []);

  const activeLinks = useMemo(() => links.filter((l) => !l.revoked_at), [links]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="secondary" size="sm">
            <Link2 size={14} aria-hidden /> Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Share {resourceLabel ?? "this resource"}</DialogTitle>
          <DialogDescription>
            Create a public link anyone with the URL can open. Add a passcode or expiry to scope access.
          </DialogDescription>
        </DialogHeader>

        {error && <Alert kind="error">{error}</Alert>}

        {/* Create form */}
        <section className="space-y-3 border-b border-[var(--border-color)] pb-4">
          <h2 className="text-sm font-semibold tracking-tight">Create a link</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="mb-1 block font-medium">Label (optional)</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Producer preview"
                maxLength={120}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Expires in</span>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value as ExpiryPreset)}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              >
                {(Object.keys(EXPIRY_LABEL) as ExpiryPreset[]).map((k) => (
                  <option key={k} value={k}>
                    {EXPIRY_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Passcode (optional)</span>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Leave blank for none"
                minLength={4}
                maxLength={128}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">Max uses (optional)</span>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                min={1}
                max={10000}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="mb-1 block font-medium">Access</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "commenter")}
                className="w-full rounded-md border border-[var(--border-color)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--org-primary)]"
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="commenter">Commenter (can leave annotations)</option>
              </select>
            </label>
          </div>

          {justCreatedUrl && (
            <div className="surface-inset flex items-center gap-2 rounded-md p-2">
              <input
                readOnly
                value={justCreatedUrl}
                className="flex-1 bg-transparent font-mono text-xs outline-none"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(justCreatedUrl);
                }}
              >
                <Copy size={14} aria-hidden /> Copy
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onCreate} loading={loading}>
              Create link
            </Button>
          </div>
        </section>

        {/* Existing links */}
        <section className="space-y-2 pt-2">
          <h2 className="text-sm font-semibold tracking-tight">Active links</h2>
          {loading && links.length === 0 && <p className="text-xs text-[var(--text-muted)]">Loading…</p>}
          {!loading && activeLinks.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">No active links yet.</p>
          )}
          <ul className="divide-y divide-[var(--border-color)]">
            {activeLinks.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-medium">{l.label ?? "(unlabeled)"}</span>
                    {l.has_passcode && (
                      <Badge variant="warning" icon={<Lock size={10} aria-hidden />}>
                        passcode
                      </Badge>
                    )}
                    <Badge variant="muted">{l.role}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {l.uses} use{l.uses === 1 ? "" : "s"}
                    {l.max_uses !== null && ` / ${l.max_uses}`}
                    {l.expires_at && ` · expires ${new Date(l.expires_at).toLocaleString()}`}
                    {!l.expires_at && " · no expiry"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevoke(l.id)}
                  aria-label={`Revoke link ${l.label ?? l.id}`}
                >
                  <Trash2 size={14} aria-hidden /> Revoke
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
