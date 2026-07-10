"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";
import { resendInviteAction, revokeInviteAction } from "./actions";

/**
 * Per-row controls for a pending invite:
 *  - Copy Link — writes the accept-invite URL to the clipboard (the old
 *    control was an <a href> that NAVIGATED the admin into the accept flow).
 *  - Resend — re-sends the invitation email (admin only).
 *  - Revoke — confirm dialog, then flips the invite to revoked (admin only).
 */
export function InviteRowActions({
  inviteId,
  acceptUrl,
  isAdmin,
}: {
  inviteId: string;
  acceptUrl: string;
  isAdmin: boolean;
}) {
  const toast = useToast();
  const t = useT();
  const [copied, setCopied] = React.useState(false);
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(acceptUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("console.people.invites.copyFailed", undefined, "Could not copy the link"), {
        description: acceptUrl,
      });
    }
  }

  function resend() {
    startTransition(async () => {
      const result = await resendInviteAction(inviteId);
      if (result && "error" in result && result.error) {
        toast.error(t("console.people.invites.resendFailed", undefined, "Could not resend the invite"), {
          description: result.error,
        });
      } else {
        toast.success(t("console.people.invites.resendOk", undefined, "Invitation email resent"));
      }
    });
  }

  async function revoke() {
    const result = await revokeInviteAction(inviteId);
    if (result && "error" in result && result.error) {
      toast.error(t("console.people.invites.revokeFailed", undefined, "Could not revoke the invite"), {
        description: result.error,
      });
    } else {
      toast.success(t("console.people.invites.revokeOk", undefined, "Invite revoked"));
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="sm" onClick={copy}>
        {copied
          ? t("console.people.invites.copied", undefined, "Copied")
          : t("console.people.invites.copyLink", undefined, "Copy Link")}
      </Button>
      {isAdmin && (
        <>
          <Button type="button" variant="ghost" size="sm" onClick={resend} disabled={pending}>
            {t("console.people.invites.resend", undefined, "Resend")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRevoke(true)} disabled={pending}>
            {t("console.people.invites.revoke", undefined, "Revoke")}
          </Button>
          <ConfirmDialog
            open={confirmRevoke}
            onOpenChange={setConfirmRevoke}
            title={t("console.people.invites.revokeTitle", undefined, "Revoke this invite?")}
            description={t(
              "console.people.invites.revokeDescription",
              undefined,
              "The accept link stops working immediately. You can always send a new invite later.",
            )}
            confirmLabel={t("console.people.invites.revoke", undefined, "Revoke")}
            tone="danger"
            onConfirm={revoke}
          />
        </>
      )}
    </div>
  );
}
