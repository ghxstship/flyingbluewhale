import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { CREDENTIAL_TYPE_LABELS } from "@/lib/open-shifts";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-display mt-2 text-3xl">{t("m.credentials.title", undefined, "Credentials")}</h1>
        <div className="card-elevated mt-6 p-4 text-sm">Configure Supabase.</div>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: creds } = await supabase
    .from("digital_credentials")
    .select("id, credential_title, credential_type, issued_at, expires_at, qr_token, is_revoked, description")
    .eq("holder_id", session.userId)
    .eq("is_revoked", false)
    .order("issued_at", { ascending: false })
    .limit(100);

  type CredRow = {
    id: string; credential_title: string; credential_type: string;
    issued_at: string; expires_at: string | null; qr_token: string;
    is_revoked: boolean; description: string | null;
  };

  const credentials = (creds ?? []) as CredRow[];

  const now = new Date();
  const active = credentials.filter(
    (c) => !c.is_revoked && (!c.expires_at || new Date(c.expires_at) > now),
  );
  const expired = credentials.filter(
    (c) => !c.is_revoked && c.expires_at && new Date(c.expires_at) <= now,
  );

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">
        {t("m.credentials.eyebrow", undefined, "Advancing")}
      </div>
      <h1 className="text-display mt-2 text-3xl">
        {t("m.credentials.title", undefined, "My Credentials")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          "m.credentials.subtitle",
          { count: active.length },
          `${active.length} active credential${active.length !== 1 ? "s" : ""}`,
        )}
      </p>

      {credentials.length === 0 ? (
        <div className="card-elevated mt-6 p-6 text-center">
          <p className="text-sm font-medium">{t("m.credentials.empty.label", undefined, "No credentials yet")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {t("m.credentials.empty.desc", undefined, "Credentials are issued by your team coordinator and appear here automatically.")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {active.map((cred) => (
            <CredentialCard key={cred.id} cred={cred} />
          ))}
          {expired.length > 0 && (
            <>
              <li className="pt-2">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  {t("m.credentials.expired", undefined, "Expired")}
                </p>
              </li>
              {expired.map((cred) => (
                <CredentialCard key={cred.id} cred={cred} dimmed />
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

type CredentialCardProps = {
  cred: CredRow;
  dimmed?: boolean;
};

function CredentialCard({ cred, dimmed }: CredentialCardProps) {
  const typeLabel =
    CREDENTIAL_TYPE_LABELS[cred.credential_type as keyof typeof CREDENTIAL_TYPE_LABELS] ?? cred.credential_type;
  const issuedLabel = new Date(cred.issued_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const expiresLabel = cred.expires_at
    ? new Date(cred.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <li className={`card-elevated overflow-hidden ${dimmed ? "opacity-50" : ""}`}>
      {/* Header strip */}
      <div className="bg-[var(--brand-color)] px-4 py-3">
        <p className="text-xs font-medium text-white/70 uppercase tracking-wide">{typeLabel}</p>
        <p className="text-base font-semibold text-white mt-0.5">{cred.credential_title}</p>
      </div>

      <div className="p-4 space-y-3">
        {cred.description && (
          <p className="text-xs text-[var(--color-text-secondary)]">{cred.description}</p>
        )}

        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)]">Issued </span>
            <span className="font-medium">{issuedLabel}</span>
          </div>
          {expiresLabel && (
            <div>
              <span className="text-[var(--text-muted)]">Expires </span>
              <span className="font-medium">{expiresLabel}</span>
            </div>
          )}
        </div>

        {/* QR token display — in prod render with a QR library */}
        <div className="rounded-lg bg-white p-3 flex flex-col items-center gap-2">
          <div
            className="font-mono text-xs text-center text-black select-all break-all leading-tight"
            aria-label={`Credential QR token for ${cred.credential_title}`}
          >
            {cred.qr_token}
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">Present at access points</p>
        </div>
      </div>
    </li>
  );
}
