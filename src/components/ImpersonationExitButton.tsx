"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Client island that ends impersonation: DELETEs the impersonate endpoint
 * (which restores the developer's real session from the signed cookie) then
 * hard-reloads so every server component re-resolves with the restored
 * session.
 */
export function ImpersonationExitButton() {
  const [pending, setPending] = useState(false);

  async function exit() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/v1/admin/impersonate", { method: "DELETE" });
    } finally {
      // Full reload regardless — the cookie swap means a soft refresh could
      // race the new session; a hard reload guarantees a clean re-resolve.
      window.location.assign("/studio");
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={exit} loading={pending}>
      Exit
    </Button>
  );
}
