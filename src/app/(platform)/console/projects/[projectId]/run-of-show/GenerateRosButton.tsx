"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/hooks/useToast";

type Props = {
  projectId: string;
  variant?: "primary" | "secondary";
};

export function GenerateRosButton({ projectId, variant = "secondary" }: Props) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/projects/${projectId}/run-of-show/generate`, { method: "POST" });
      const json = await r.json();
      if (!r.ok || !json.ok) {
        throw new Error(json?.error?.message ?? "AI generation failed");
      }
      toast.success(`Generated ${json.data.generated} cues`, {
        description: "Run of show updated from your project data.",
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
      ✦ Generate with AI
    </Button>
  );
}
