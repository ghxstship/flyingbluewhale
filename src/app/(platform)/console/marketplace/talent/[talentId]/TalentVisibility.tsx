"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/LocaleProvider";
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
  const t = useT();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="surface p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.talent.visibility.title", undefined, "Visibility")}
            </h2>
            <Badge variant={isPublic ? "success" : "muted"}>
              {isPublic
                ? t("console.marketplace.talent.visibility.published", undefined, "Published")
                : t("console.marketplace.talent.visibility.private", undefined, "Private")}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {publicHandle ? (
              <>
                {t("console.marketplace.talent.visibility.publicUrl", undefined, "Public URL")}{" "}
                <a className="font-mono text-[var(--org-primary)]" href={`/marketplace/talent/${publicHandle}`}>
                  /marketplace/talent/{publicHandle}
                </a>
              </>
            ) : (
              t("console.marketplace.talent.visibility.noHandle", undefined, "No public handle yet.")
            )}
          </p>
        </div>
        <form
          action={(fd) => {
            startTransition(async () => {
              const result = isPublic ? await unpublishTalentAction(null, fd) : await publishTalentAction(null, fd);
              if (!result?.error) router.refresh();
            });
          }}
        >
          <input type="hidden" name="talent_id" value={talentId} />
          <Button type="submit" size="sm" variant={isPublic ? "ghost" : "primary"} loading={pending}>
            {isPublic
              ? t("console.marketplace.talent.visibility.unpublish", undefined, "Unpublish")
              : t("console.marketplace.talent.visibility.publish", undefined, "Publish to Directory")}
          </Button>
        </form>
      </div>
    </section>
  );
}
