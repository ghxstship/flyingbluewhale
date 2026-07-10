"use client";

import { useTransition } from "react";
import { toast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { urlFor } from "@/lib/urls";
import { useT } from "@/lib/i18n/LocaleProvider";
import { publishCallAction, closeCallAction } from "../new/actions";

export function CallControls({ callId, status, publicSlug }: { callId: string; status: string; publicSlug: string }) {
  const [pending, startTransition] = useTransition();
  const t = useT();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.controls.visibility", undefined, "Visibility")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t("console.marketplace.calls.controls.publicUrl", undefined, "Public URL")}{" "}
            <a className="font-mono text-[var(--p-accent)]" href={urlFor("marketing", `/marketplace/calls/${publicSlug}`)}>
              /marketplace/calls/{publicSlug}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {status === "draft" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  const result = await publishCallAction(null, fd);
                  if (result?.error) toast.error(result.error);
                });
              }}
            >
              <input type="hidden" name="call_id" value={callId} />
              <Button type="submit" size="sm" loading={pending}>
                {t("console.marketplace.calls.controls.publish", undefined, "Publish")}
              </Button>
            </form>
          )}
          {status === "published" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  const result = await closeCallAction(null, fd);
                  if (result?.error) toast.error(result.error);
                });
              }}
            >
              <input type="hidden" name="call_id" value={callId} />
              <Button type="submit" size="sm" variant="ghost" loading={pending}>
                {t("console.marketplace.calls.controls.closeCall", undefined, "Close Call")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
