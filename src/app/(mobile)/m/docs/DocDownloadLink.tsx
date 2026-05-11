"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { signDocumentUrl } from "./actions";

/** Renders a "Download" button that calls the server action to mint a
 * 5-min signed URL and opens it. Used over a plain `<a>` so we never
 * expose the storage path or a long-lived URL in the HTML. */
export function DocDownloadLink({ docId }: { docId: string }) {
  const [pending, start] = useTransition();
  const click = () => {
    start(async () => {
      try {
        const url = await signDocumentUrl({ id: docId });
        if (!url) {
          toast.error("Couldn't open document");
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Open failed");
      }
    });
  };
  return (
    <Button type="button" size="sm" variant="secondary" loading={pending} onClick={click}>
      Download
    </Button>
  );
}
