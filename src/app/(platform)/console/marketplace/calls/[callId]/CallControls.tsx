"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { publishCallAction, closeCallAction } from "../new/actions";

export function CallControls({ callId, status, publicSlug }: { callId: string; status: string; publicSlug: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Visibility</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Public URL{" "}
            <a className="font-mono text-[var(--org-primary)]" href={`/marketplace/calls/${publicSlug}`}>
              /marketplace/calls/{publicSlug}
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {status === "draft" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await publishCallAction(null, fd);
                });
              }}
            >
              <input type="hidden" name="call_id" value={callId} />
              <Button type="submit" size="sm" loading={pending}>
                Publish
              </Button>
            </form>
          )}
          {status === "published" && (
            <form
              action={(fd) => {
                startTransition(async () => {
                  await closeCallAction(null, fd);
                });
              }}
            >
              <input type="hidden" name="call_id" value={callId} />
              <Button type="submit" size="sm" variant="ghost" loading={pending}>
                Close Call
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
