"use client";

import * as React from "react";
import toast from "react-hot-toast";
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

const COOKIE_NAME = "fbw_consent";

export function PrivacyControls() {
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
        throw new Error(json?.error?.message ?? "Couldn't delete");
      }
      toast.success("Account scheduled for deletion in 30 days.");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't delete");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card
        icon={<Download size={16} />}
        title="Export my data"
        body="Download every row in our database that belongs to you — JSON. Includes profile, memberships, conversations, expenses, time entries, and audit log entries you initiated."
        action={
          <Button onClick={exportData} loading={exporting} variant="secondary">
            Download
          </Button>
        }
      />

      <Card
        icon={<Cookie size={16} />}
        title="Cookie preferences"
        body="Re-open the cookie consent panel to update your analytics & marketing choices."
        action={
          <Button onClick={reopenConsent} variant="secondary">
            Manage cookies
          </Button>
        }
      />

      <Card
        icon={<ShieldAlert size={16} />}
        title="Delete my account"
        body="Soft-deletes immediately. Permanently purged after 30 days. Sign in within that window to cancel."
        action={
          <Button onClick={() => setOpenDelete(true)} variant="danger">
            Delete account
          </Button>
        }
        accent="danger"
      />

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This soft-deletes your profile and revokes every membership immediately. Your data is
              permanently purged in 30 days. To proceed, type{" "}
              <code className="rounded bg-[var(--surface-inset)] px-1 py-0.5 font-mono text-xs">
                delete my account
              </code>{" "}
              below.
            </DialogDescription>
          </DialogHeader>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete my account"
            aria-label="Type the confirmation phrase"
            className="input-base mt-4 w-full"
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={deleteAccount}
              disabled={confirmText !== "delete my account" || deleting}
              loading={deleting}
            >
              Delete account
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
      className={`surface-raised flex flex-wrap items-start justify-between gap-4 p-5 ${accent === "danger" ? "border border-[var(--color-error)]/30" : ""}`}
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
