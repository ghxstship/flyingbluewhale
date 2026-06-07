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
import { useT } from "@/lib/i18n/LocaleProvider";

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

// Expiry preset keys; the user-facing labels resolve through the catalog at
// render time (shareDialog.expiry.*) so they localize.
const EXPIRY_PRESETS: ExpiryPreset[] = ["1h", "24h", "7d", "30d", "never"];
const EXPIRY_FALLBACK: Record<ExpiryPreset, string> = {
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
  const t = useT();
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
        setError(json.error?.message ?? t("shareDialog.errors.loadFailed", undefined, "Failed to load links"));
        return;
      }
      setLinks(json.data?.links ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("shareDialog.errors.loadFailed", undefined, "Failed to load links"));
    } finally {
      setLoading(false);
    }
  }, [resourceTable, resourceId, t]);

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
        setError(json.error?.message ?? t("shareDialog.errors.createFailed", undefined, "Failed to create link"));
        return;
      }
      setJustCreatedUrl(json.data.url);
      setLinks((prev) => [json.data!.link, ...prev]);
      setLabel("");
      setPasscode("");
      setMaxUses("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t("shareDialog.errors.createFailed", undefined, "Failed to create link"),
      );
    } finally {
      setLoading(false);
    }
  }, [expiry, label, maxUses, passcode, resourceId, resourceTable, role, t]);

  const onRevoke = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/v1/share-links/${encodeURIComponent(id)}`, { method: "DELETE" });
        const json = (await r.json()) as { ok: boolean; error?: { message: string } };
        if (!r.ok || !json.ok) {
          setError(json.error?.message ?? t("shareDialog.errors.revokeFailed", undefined, "Failed to revoke"));
          return;
        }
        setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, revoked_at: new Date().toISOString() } : l)));
      } catch (e) {
        setError(e instanceof Error ? e.message : t("shareDialog.errors.revokeFailed", undefined, "Failed to revoke"));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const activeLinks = useMemo(() => links.filter((l) => !l.revoked_at), [links]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="secondary" size="sm">
            <Link2 size={14} aria-hidden /> {t("shareDialog.shareButton", undefined, "Share")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {t(
              "shareDialog.title",
              { label: resourceLabel ?? t("shareDialog.titleFallback", undefined, "this resource") },
              `Share ${resourceLabel ?? "this resource"}`,
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              "shareDialog.description",
              undefined,
              "Create a public link anyone with the URL can open. Add a passcode or expiry to scope access.",
            )}
          </DialogDescription>
        </DialogHeader>

        {error && <Alert kind="error">{error}</Alert>}

        {/* Create form */}
        <section className="space-y-3 border-b border-[var(--p-border)] pb-4">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("shareDialog.createHeading", undefined, "Create a link")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="mb-1 block font-medium">
                {t("shareDialog.labelField", undefined, "Label · Optional")}
              </span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t("shareDialog.labelPlaceholder", undefined, "e.g. Producer preview")}
                maxLength={120}
                className="ps-input w-full"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">{t("shareDialog.expiresIn", undefined, "Expires in")}</span>
              <select
                value={expiry}
                onChange={(e) => setExpiry(e.target.value as ExpiryPreset)}
                className="ps-input w-full"
              >
                {EXPIRY_PRESETS.map((k) => (
                  <option key={k} value={k}>
                    {t(`shareDialog.expiry.${k}`, undefined, EXPIRY_FALLBACK[k])}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">
                {t("shareDialog.passcodeField", undefined, "Passcode · Optional")}
              </span>
              <input
                type="text"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={t("shareDialog.passcodePlaceholder", undefined, "Leave blank for none")}
                minLength={4}
                maxLength={128}
                className="ps-input w-full"
              />
            </label>
            <label className="text-xs">
              <span className="mb-1 block font-medium">
                {t("shareDialog.maxUsesField", undefined, "Max Uses · Optional")}
              </span>
              <input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder={t("shareDialog.maxUsesPlaceholder", undefined, "Unlimited")}
                min={1}
                max={10000}
                className="ps-input w-full"
              />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="mb-1 block font-medium">{t("shareDialog.access", undefined, "Access")}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "commenter")}
                className="ps-input w-full"
              >
                <option value="viewer">{t("shareDialog.roleViewer", undefined, "Viewer · Read-only")}</option>
                <option value="commenter">
                  {t("shareDialog.roleCommenter", undefined, "Commenter · Can Leave Annotations")}
                </option>
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
                <Copy size={14} aria-hidden /> {t("shareDialog.copy", undefined, "Copy")}
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onCreate} loading={loading}>
              {t("shareDialog.createLink", undefined, "Create link")}
            </Button>
          </div>
        </section>

        {/* Existing links */}
        <section className="space-y-2 pt-2">
          <h2 className="text-sm font-semibold tracking-tight">
            {t("shareDialog.activeHeading", undefined, "Active links")}
          </h2>
          {loading && links.length === 0 && (
            <p className="text-xs text-[var(--p-text-2)]">{t("shareDialog.loading", undefined, "Loading…")}</p>
          )}
          {!loading && activeLinks.length === 0 && (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("shareDialog.noLinks", undefined, "No active links yet.")}
            </p>
          )}
          <ul className="divide-y divide-[var(--p-border)]">
            {activeLinks.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-medium">
                      {l.label ?? t("shareDialog.unlabeled", undefined, "(unlabeled)")}
                    </span>
                    {l.has_passcode && (
                      <Badge variant="warning" icon={<Lock size={10} aria-hidden />}>
                        {t("shareDialog.passcodeBadge", undefined, "passcode")}
                      </Badge>
                    )}
                    <Badge variant="muted">{l.role}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--p-text-2)]">
                    {l.uses === 1
                      ? t("shareDialog.useSingular", { count: l.uses }, `${l.uses} use`)
                      : t("shareDialog.usePlural", { count: l.uses }, `${l.uses} uses`)}
                    {l.max_uses !== null && t("shareDialog.maxSuffix", { max: l.max_uses }, ` / ${l.max_uses}`)}
                    {l.expires_at &&
                      t(
                        "shareDialog.expiresSuffix",
                        { date: new Date(l.expires_at).toLocaleString() },
                        ` · expires ${new Date(l.expires_at).toLocaleString()}`,
                      )}
                    {!l.expires_at && t("shareDialog.noExpiry", undefined, " · no expiry")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRevoke(l.id)}
                  aria-label={t("shareDialog.revokeAria", { name: l.label ?? l.id }, `Revoke link ${l.label ?? l.id}`)}
                >
                  <Trash2 size={14} aria-hidden /> {t("shareDialog.revoke", undefined, "Revoke")}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("shareDialog.done", undefined, "Done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
