"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { publishPostingAction, closePostingAction } from "../new/actions";

export function PublishControls({
  postingId,
  status,
  publicSlug,
  expiresAt,
}: {
  postingId: string;
  status: string;
  publicSlug: string;
  expiresAt: string | null;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.postings.publish.visibility", undefined, "Visibility")}
          </h2>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t("console.marketplace.postings.publish.publicUrl", undefined, "Public URL")}{" "}
            <a className="font-mono text-[var(--p-accent)]" href={`/marketplace/gigs/${publicSlug}`}>
              /marketplace/gigs/{publicSlug}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {status === "draft" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  const result = await publishPostingAction(null, fd);
                  if (result?.error) toast.error(result.error);
                });
              }}
              className="flex items-end gap-2"
            >
              <input type="hidden" name="posting_id" value={postingId} />
              <Input
                label={t("console.marketplace.postings.publish.expiresLabel", undefined, "Expires")}
                name="expires_at"
                type="datetime-local"
                defaultValue={expiresAt ?? ""}
              />
              <Button type="submit" size="sm" loading={pending}>
                {t("console.marketplace.postings.publish.publish", undefined, "Publish")}
              </Button>
            </form>
          )}
          {status === "published" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  const result = await closePostingAction(null, fd);
                  if (result?.error) toast.error(result.error);
                });
              }}
            >
              <input type="hidden" name="posting_id" value={postingId} />
              <Button type="submit" size="sm" variant="ghost" loading={pending}>
                {t("console.marketplace.postings.publish.closePosting", undefined, "Close Posting")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
