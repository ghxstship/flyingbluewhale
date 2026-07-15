"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { leaveOrgAction, type State } from "./actions";

/**
 * Voluntary self-departure per membership row. Two-step confirm (Leave →
 * Confirm) because it's destructive — soft-deletes your membership + cascades.
 * The last-owner guard is server-side; its refusal surfaces as a toast.
 */
export function LeaveOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const t = useT();
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [state, formAction, pending] = useActionState<State, FormData>(leaveOrgAction, null);

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
      setConfirming(false);
    }
    if (state?.ok) {
      toast.success(t("me.organizations.leftToast", { orgName }, `You left ${orgName}`));
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (!confirming) {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        {t("me.organizations.leave", undefined, "Leave")}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1.5">
      <input type="hidden" name="org_id" value={orgId} />
      <Button type="submit" size="sm" variant="danger" loading={pending}>
        {t("me.organizations.leaveConfirm", undefined, "Confirm leave")}
      </Button>
      <Button type="button" size="sm" variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
        {t("common.cancel", undefined, "Cancel")}
      </Button>
    </form>
  );
}
