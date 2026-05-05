"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { publishTalentAction, unpublishTalentAction } from "../new/actions";

export function TalentVisibility({
  talentId,
  isPublic,
  publicHandle,
}: {
  talentId: string;
  isPublic: boolean;
  publicHandle: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase">Visibility</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {publicHandle ? (
              <>
                Public URL{" "}
                <a className="font-mono text-[var(--org-primary)]" href={`/marketplace/talent/${publicHandle}`}>
                  /marketplace/talent/{publicHandle}
                </a>
              </>
            ) : (
              "No public handle yet."
            )}
          </p>
        </div>
        <form
          action={(fd) => {
            startTransition(async () => {
              if (isPublic) await unpublishTalentAction(null, fd);
              else await publishTalentAction(null, fd);
            });
          }}
        >
          <input type="hidden" name="talent_id" value={talentId} />
          <Button type="submit" size="sm" variant={isPublic ? "ghost" : "primary"} loading={pending}>
            {isPublic ? "Unpublish" : "Publish to Directory"}
          </Button>
        </form>
      </div>
    </section>
  );
}
