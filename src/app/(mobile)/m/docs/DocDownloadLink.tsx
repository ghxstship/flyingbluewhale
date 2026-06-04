"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signDocumentUrl } from "./actions";

/** Renders a "Download" button that calls the server action to mint a
 * 5-min signed URL and opens it. Used over a plain `<a>` so we never
 * expose the storage path or a long-lived URL in the HTML. */
export function DocDownloadLink({ docId }: { docId: string }) {
  const t = useT();
  const [pending, start] = useTransition();
  const click = () => {
    start(async () => {
      try {
        const url = await signDocumentUrl({ id: docId });
        if (!url) {
          toast.error(t("m.docs.download.openError", undefined, "Couldn't open document"));
          return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("m.docs.download.openFailed", undefined, "Open failed"));
      }
    });
  };
  return (
    <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={click}>
      {pending
        ? t("m.docs.download.opening", undefined, "Opening…")
        : t("m.docs.download.label", undefined, "Download")}
    </button>
  );
}
