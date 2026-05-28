"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";

export function ApprovalActions({ approvalId }: { approvalId: string }) {
  const [loading, setLoading] = React.useState<"approve" | "reject" | null>(null);
  const [reviewerNotes, setReviewerNotes] = React.useState("");
  const router = useRouter();
  const toast = useToast();

  async function resolve(state: "approved" | "rejected") {
    setLoading(state === "approved" ? "approve" : "reject");
    try {
      const r = await fetch(`/api/v1/procurement/approvals/${approvalId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approval_request_state: state, reviewer_notes: reviewerNotes || undefined }),
      });
      const json = await r.json();
      if (!r.ok || !json.ok) throw new Error(json?.error?.message ?? "Action failed");
      toast.success(state === "approved" ? "Approved" : "Rejected", {
        description: "The requester has been notified.",
      });
      router.refresh();
    } catch (e) {
      toast.error("Action failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
      <div>
        <label className="text-xs font-medium text-[var(--color-text-muted)] block mb-1">
          Reviewer notes (optional)
        </label>
        <textarea
          className="input w-full text-sm"
          rows={3}
          placeholder="Add context for the requester…"
          value={reviewerNotes}
          onChange={(e) => setReviewerNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => resolve("approved")}
          disabled={loading !== null}
          loading={loading === "approve"}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={() => resolve("rejected")}
          disabled={loading !== null}
          loading={loading === "reject"}
        >
          Reject
        </Button>
      </div>
    </div>
  );
}
