import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MSADocument } from "@/components/msa/MSADocument";
import { Badge } from "@/components/ui/Badge";
import { hasSupabase } from "@/lib/env";
import { getMsaByToken } from "@/lib/msa/queries";
import { MSA_STATUS_LABEL, MSA_STATUS_VARIANT } from "@/lib/msa/types";
import { UnlockForm } from "./UnlockForm";
import { SignForm } from "./SignForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();

  const c = await cookies();
  const code = c.get(`msa_${token}`)?.value;

  if (!code) {
    return <UnlockForm token={token} />;
  }

  const msa = await getMsaByToken(token, code);
  if (!msa || !msa.id) {
    return <UnlockForm token={token} expired />;
  }

  const role = (msa.crew_member_role ?? "").toLowerCase();
  const showChapter624 =
    role.includes("carpentry") ||
    role.includes("electrical") ||
    role.includes("rigging") ||
    role.includes("steel") ||
    role.includes("heavy");

  const alreadySigned = msa.msa_state === "signed";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant={MSA_STATUS_VARIANT[msa.msa_state]}>{MSA_STATUS_LABEL[msa.msa_state]}</Badge>
        <div className="flex items-center gap-3 text-xs">
          <a
            href={`/msa/${token}/print`}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-[var(--border-default)] px-3 py-1.5 text-[var(--text-secondary)] hover:border-[var(--org-primary)] hover:text-[var(--org-primary)]"
          >
            Download PDF / Print
          </a>
          <span className="text-[var(--text-muted)]">Reference · MSA-{msa.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      <MSADocument msa={msa} orgName={msa.org_name} />

      {!alreadySigned && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
            Sign &amp; Submit
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Once signed, this Agreement applies to every engagement letter we issue you, until revoked or superseded.
            You won&rsquo;t be asked to re-sign this for future productions — just the engagement letter for each one.
          </p>
          <SignForm token={token} showChapter624={showChapter624} />
        </div>
      )}
    </div>
  );
}
