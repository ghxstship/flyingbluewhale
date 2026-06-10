import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo, toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Json } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";

type Playbook = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  kind: string;
  status: "draft" | "published" | "archived";
  version: number;
  content: Json;
  created_at: string;
  updated_at: string;
};

const STATUS_TONE: Record<Playbook["status"], "muted" | "success" | "warning"> = {
  draft: "muted",
  published: "success",
  archived: "warning",
};

const KIND_LABEL: Record<string, string> = {
  crisis: "Crisis",
  safety: "Safety",
  onboarding: "Onboarding",
  conops: "ConOps",
  general: "General",
};

type Block = { type?: string; heading?: string; body?: string; items?: string[] } | string;

function getBlocks(content: Json): Block[] {
  if (!content || typeof content !== "object") return [];
  const obj = content as { blocks?: unknown };
  if (Array.isArray(obj.blocks)) return obj.blocks as Block[];
  return [];
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.playbooks.eyebrow", undefined, "Safety")}
          title={t("console.safety.playbooks.detail.title", undefined, "Playbook")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.playbooks.detail.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("playbooks")
    .select("id, slug, title, summary, kind, playbook_state, version, content, created_at, updated_at")
    .eq("slug", slug)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const pb = data as unknown as Playbook | null;
  if (!pb) notFound();

  const blocks = getBlocks(pb.content);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.playbooks.detail.eyebrow", undefined, "Playbook")}
        title={pb.title}
        subtitle={
          <span className="font-mono text-xs">
            {t(
              "console.safety.playbooks.detail.versionUpdated",
              { version: pb.version, time: timeAgo(pb.updated_at) },
              `v${pb.version} · updated ${timeAgo(pb.updated_at)}`,
            )}
          </span>
        }
        breadcrumbs={[
          { label: t("console.safety.breadcrumb", undefined, "Safety"), href: "/console/safety" },
          {
            label: t("console.safety.playbooks.breadcrumb", undefined, "Playbooks"),
            href: "/console/safety/playbooks",
          },
          { label: pb.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="info">
              {t(`console.safety.playbooks.kind.${pb.kind}`, undefined, KIND_LABEL[pb.kind] ?? pb.kind)}
            </Badge>
            <Badge variant={STATUS_TONE[pb.status]}>
              {t(`console.safety.playbooks.status.${pb.status}`, undefined, toTitle(pb.status))}
            </Badge>
          </div>
        }
      />
      <div className="page-content space-y-5">
        {pb.summary && <p className="text-sm text-[var(--p-text-2)]">{pb.summary}</p>}

        {blocks.length === 0 ? (
          <div className="surface p-6 text-sm text-[var(--p-text-2)]">
            {t(
              "console.safety.playbooks.detail.emptyBlocks",
              undefined,
              "No content blocks yet. The author has not added sections to this playbook.",
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, i) => {
              if (typeof block === "string") {
                return (
                  <div key={i} className="surface p-5 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">
                    {block}
                  </div>
                );
              }
              return (
                <section key={i} className="surface p-5">
                  {block.heading && <h3 className="text-base font-semibold">{block.heading}</h3>}
                  {block.body && (
                    <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{block.body}</p>
                  )}
                  {block.items && block.items.length > 0 && (
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {block.items.map((it, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-[var(--p-text-2)]">·</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
