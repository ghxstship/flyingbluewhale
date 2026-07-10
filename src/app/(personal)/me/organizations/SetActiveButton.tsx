"use client";

import * as React from "react";
import { useActionState } from "react";
import { toast } from "@/lib/hooks/useToast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setActiveWorkspaceAction, type State } from "./actions";

/** "Set active" per membership row — flips the workspace pointer and
 *  refreshes so every server component re-resolves the new tenant. */
export function SetActiveButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const t = useT();
  const router = useRouter();
  const [state, formAction, pending] = useActionState<State, FormData>(setActiveWorkspaceAction, null);

  React.useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.ok) {
      toast.success(t("me.organizations.switchedToast", { orgName }, `Switched to ${orgName}`));
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="org_id" value={orgId} />
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        {t("me.organizations.setActive", undefined, "Set Active")}
      </Button>
    </form>
  );
}
