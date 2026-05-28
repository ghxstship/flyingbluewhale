"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";

type Props = {
  projectId: string;
  hasExisting: boolean;
  variant?: "primary" | "secondary";
};

export function GenerateDebriefButton({ projectId, hasExisting, variant = "secondary" }: Props) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/projects/${projectId}/debrief/generate`, { method: "POST" });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "AI generation failed");
      }
      toast.success("Debrief generated", {
        description: "Your post-event report is ready.",
      });
      router.refresh();
    } catch (e) {
      toast.error("Generation failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant={variant} onClick={generate} disabled={loading} loading={loading}>
      {hasExisting ? "✦ Regenerate debrief" : "✦ Generate debrief"}
    </Button>
  );
}
