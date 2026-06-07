import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Markdown } from "@/components/Markdown";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Article = {
  id: string;
  slug: string;
  title: string;
  body_markdown: string;
  tags: string[] | null;
  version: number;
  updated_at: string;
};

function tagsOf(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((tag): tag is string => typeof tag === "string");
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string; course: string }> }) {
  const { slug, course } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.vendor.training.eyebrow.portal", undefined, "Portal")}
          title={t("p.vendor.training.title", undefined, "Training")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.vendor.training.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("kb_articles")
    .select("id, slug, title, body_markdown, tags, version, updated_at")
    .eq("slug", course)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const article = data as unknown as Article | null;
  if (!article) notFound();

  const tags = tagsOf(article.tags);

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.vendor.training.eyebrow.vendorTraining", undefined, "Vendor Training")}
        title={article.title}
        subtitle={
          <span className="font-mono text-xs">
            {t(
              "p.vendor.training.versionUpdated",
              { version: article.version, ago: timeAgo(article.updated_at) },
              `v${article.version} · updated ${timeAgo(article.updated_at)}`,
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("p.vendor.training.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.vendor.training.breadcrumb.vendor", undefined, "Vendor"), href: `/p/${slug}/vendor` },
          {
            label: t("p.vendor.training.breadcrumb.training", undefined, "Training"),
            href: `/p/${slug}/vendor/training`,
          },
          { label: article.title },
        ]}
        action={
          <Button href={`/p/${slug}/vendor/training`} variant="ghost" size="sm">
            {t("common.back", undefined, "Back")}
          </Button>
        }
      />
      <div className="page-content max-w-3xl space-y-5">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="muted">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <article className="surface p-8">
          <Markdown source={article.body_markdown} />
        </article>

        <footer className="surface p-5 text-xs text-[var(--p-text-2)]">
          <div className="font-medium text-[var(--p-text-2)]">
            {t("p.vendor.training.ack.heading", undefined, "Acknowledged your training?")}
          </div>
          <p className="mt-1">
            {t(
              "p.vendor.training.ack.body",
              undefined,
              "Acknowledgements are recorded against your vendor record. Contact the producer if you need a confirmation email or a copy for your records.",
            )}
          </p>
          <div className="mt-3">
            <Link
              href={`/p/${slug}/vendor/training`}
              className="text-[var(--p-accent)] underline-offset-2 hover:underline"
            >
              {t("p.vendor.training.ack.allModules", undefined, "All training modules →")}
            </Link>
          </div>
        </footer>
      </div>
    </>
  );
}
