"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget view tracker. Mount on portal proposal pages to log a view
 * event via POST /api/v1/proposals/[id]/view. Dedup logic lives server-side
 * (15-min window per viewer) so rapid navigations are harmless.
 */
export function ProposalViewTracker({
  proposalId,
  persona,
}: {
  proposalId: string;
  persona?: string;
}) {
  useEffect(() => {
    void fetch(`/api/v1/proposals/${proposalId}/view`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ persona }),
    });
    // Only fire on mount — proposalId/persona won't change within a render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
