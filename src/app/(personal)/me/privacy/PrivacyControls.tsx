"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, ShieldAlert, Cookie } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { useT } from "@/lib/i18n/LocaleProvider";

const COOKIE_NAME = "atlvs_consent";
const LEGACY_COOKIE_NAME = "fbw_consent";

export function PrivacyControls() {
  const t = useT();
  const [exporting, setExporting] = React.useState(false);
  const [openDelete, setOpenDelete] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  async function exportData() {
    setExporting(true);
    try {
      window.location.href = "/api/v1/me/export";
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  }

  function reopenConsent() {
    document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`;
    // Also clear the pre-brand-sweep cookie so the consent dialog isn't
    // shadowed by it on next load.
    document.cookie = `${LEGACY_COOKIE_NAME}=; max-age=0; path=/`;
    window.location.reload();
  }

  async function deleteAccount() {
    if (confirmText !== "delete my account") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/v1/me/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmPhrase: "delete my account" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.error?.message ?? t("me.privacy.errors.deleteFailed", undefined, "Couldn't delete"));
      }
      toast.success(t("me.privacy.toast.scheduled", undefined, "Account scheduled for deletion in 30 days."));
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("me.privacy.errors.deleteFailed", undefined, "Couldn't delete"));
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card
        icon={<Download size={16} />}
        title={t("me.privacy.export.title", undefined, "Export My Data")}
        body={t(
          "me.privacy.export.body",
          undefined,
          "Download every row in our database that belongs to you — JSON. Includes profile, memberships, conversations, expenses, time entries, and audit log entries you initiated.",
        )}
        action={
          <Button onClick={exportData} loading={exporting} variant="secondary">
            {t("me.privacy.export.action", undefined, "Download")}
          </Button>
        }
      />

      <Card
        icon={<Cookie size={16} />}
        title={t("me.privacy.cookies.title", undefined, "Cookie Preferences")}
        body={t(
          "me.privacy.cookies.body",
          undefined,
          "Re-open the cookie consent panel to update your analytics & marketing choices.",
        )}
        action={
          <Button onClick={reopenConsent} variant="secondary">
            {t("me.privacy.cookies.action", undefined, "Manage cookies")}
          </Button>
        }
      />

      <Card
        icon={<ShieldAlert size={16} />}
        title={t("me.privacy.delete.title", undefined, "Delete My Account")}
        body={t(
          "me.privacy.delete.body",
          undefined,
          "Soft-deletes immediately. Permanently purged after 30 days. Sign in within that window to cancel.",
        )}
        action={
          <Button onClick={() => setOpenDelete(true)} variant="danger">
            {t("me.privacy.delete.action", undefined, "Delete account")}
          </Button>
        }
        accent="danger"
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>{t("me.privacy.dialog.title", undefined, "Delete Your Account?")}</DialogTitle>
            <DialogDescription>
              {t(
                "me.privacy.dialog.descriptionPrefix",
                undefined,
                "This soft-deletes your profile and revokes every membership immediately. Your data is permanently purged in 30 days. To proceed, type",
              )}{" "}
              <code className="rounded bg-[var(--surface-inset)] px-1 py-0.5 font-mono text-xs">delete my account</code>{" "}
              {t("me.privacy.dialog.descriptionSuffix", undefined, "below.")}
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("me.privacy.dialog.placeholder", undefined, "delete my account")}
            aria-label={t("me.privacy.dialog.ariaLabel", undefined, "Type the Confirmation Phrase")}
            className="input-base mt-4 w-full"
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>
              {t("common.cancel", undefined, "Cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={deleteAccount}
              disabled={confirmText !== "delete my account" || deleting}
              loading={deleting}
            >
              {t("me.privacy.delete.action", undefined, "Delete account")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({
  icon,
  title,
  body,
  action,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: React.ReactNode;
  accent?: "danger";
}) {
  return (
    <div
      className={`surface flex flex-wrap items-start justify-between gap-4 p-5 ${accent === "danger" ? "border border-[var(--color-error)]/30" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${accent === "danger" ? "bg-[var(--color-error)]/10 text-[var(--color-error)]" : "bg-[var(--surface-inset)] text-[var(--org-primary)]"}`}
        >
          {icon}
        </div>
        <div className="max-w-md">
          <div className="text-sm font-semibold">{title}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">{body}</div>
        </div>
      </div>
      <div>{action}</div>
    </div>
  );
}
