import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getOfferLetter, listOfferLetterActivity } from "@/lib/offer-letters/queries";
import { offerPublicUrl } from "@/lib/offer-letters/format";
import {
  STATUS_LABEL,
  STATUS_VARIANT,
  EMPLOYER_LABEL,
  CLASSIFICATION_LABEL,
  BASIS_LABEL,
} from "@/lib/offer-letters/types";
import { createClient } from "@/lib/supabase/server";
import { LetterDocument } from "@/components/offer-letters/LetterDocument";
import { LetterEditor } from "./LetterEditor";
import { LetterShareCard } from "./LetterShareCard";
import { LetterLifecycleActions } from "./LetterLifecycleActions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) notFound();
  const session = await requireSession();
  const letter = await getOfferLetter(session.orgId, id);
  if (!letter) notFound();

  let projectLabel = "Project TBD";
  if (letter.project_id) {
    const supabase = await createClient();
    const { data: project } = await supabase.from("projects").select("name").eq("id", letter.project_id).maybeSingle();
    if (project?.name) projectLabel = project.name as string;
  }

  const activity = await listOfferLetterActivity(session.orgId, letter.id);
  const publicUrl = offerPublicUrl(letter.public_token);

  return (
    <>
      <ModuleHeader
        eyebrow={
          <Link href="/console/people/offer-letters" className="hover:text-[var(--org-primary)]">
            People · Offer Letters
          </Link>
        }
        title={letter.recipient_name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <Badge variant={STATUS_VARIANT[letter.status]}>{STATUS_LABEL[letter.status]}</Badge>
            <span>{letter.role_title}</span>
            <span>·</span>
            <span>{EMPLOYER_LABEL[letter.employer]}</span>
            <span>·</span>
            <span>{CLASSIFICATION_LABEL[letter.classification]}</span>
            <span>·</span>
            <span>{BASIS_LABEL[letter.compensation_basis]}</span>
          </span>
        }
      />
      <div className="page-content space-y-8">
        <LetterShareCard
          letterId={letter.id}
          accessCode={letter.access_code}
          publicUrl={publicUrl}
          status={letter.status}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <LetterDocument letter={letter} projectLabel={projectLabel} />
          </div>

          <div className="space-y-6">
            <LetterLifecycleActions letterId={letter.id} status={letter.status} />

            <section className="surface space-y-3 p-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Activity</h3>
              {activity.length === 0 ? (
                <div className="text-xs text-[var(--text-muted)]">No activity yet.</div>
              ) : (
                <ul className="space-y-3 text-xs">
                  {activity.map((a) => (
                    <li key={a.id} className="border-l-2 border-[var(--border-default)] pl-3">
                      <div className="font-mono tracking-wider text-[var(--text-muted)] uppercase">{a.kind}</div>
                      <div className="text-[var(--text-primary)]">{a.summary}</div>
                      <div className="text-[var(--text-muted)]">
                        {a.actor_label ? `${a.actor_label} · ` : ""}
                        {new Date(a.occurred_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>

        <LetterEditor letter={letter} />
      </div>
    </>
  );
}
