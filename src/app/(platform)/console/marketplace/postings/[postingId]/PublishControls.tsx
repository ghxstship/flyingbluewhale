"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  const [pending, startTransition] = useTransition();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Visibility</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Public URL{" "}
            <a className="font-mono text-[var(--org-primary)]" href={`/marketplace/gigs/${publicSlug}`}>
              /marketplace/gigs/{publicSlug}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {status === "draft" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await publishPostingAction(null, fd);
                });
              }}
              className="flex items-end gap-2"
            >
              <input type="hidden" name="posting_id" value={postingId} />
              <Input label="Expires" name="expires_at" type="datetime-local" defaultValue={expiresAt ?? ""} />
              <Button type="submit" size="sm" loading={pending}>
                Publish
              </Button>
            </form>
          )}
          {status === "published" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await closePostingAction(null, fd);
                });
              }}
            >
              <input type="hidden" name="posting_id" value={postingId} />
              <Button type="submit" size="sm" variant="ghost" loading={pending}>
                Close Posting
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
