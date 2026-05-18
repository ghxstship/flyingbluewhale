import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/i18n/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  rating: number;
  body: string | null;
  created_at: string;
  released_at: string | null;
  transaction_type: string;
  subject_kind: string;
  subject_user_id: string | null;
  reviewer_user_id: string;
};

export default async function Page() {
  if (!hasSupabase) return <div>Configure Supabase.</div>;
  const session = await requireSession();
  const supabase = await createClient();

  const [outResp, inResp] = await Promise.all([
    supabase
      .from("reviews")
      .select("*")
      .eq("reviewer_user_id", session.userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("reviews")
      .select("*")
      .eq("subject_user_id", session.userId)
      .not("released_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  const written = (outResp.data ?? []) as Row[];
  const received = (inResp.data ?? []) as Row[];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-label text-[var(--color-text-tertiary)]">My reviews</div>
        <h1 className="text-display mt-1 text-3xl">Reviews</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Reviews remain hidden until both sides post. No retaliation surface.
        </p>
      </header>

      <section>
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">Received</h2>
        {received.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[var(--color-text-secondary)]">No public reviews yet.</div>
        ) : (
          <ul className="space-y-2">
            {received.map((r) => (
              <ReviewLi key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-label mb-3 text-[var(--color-text-tertiary)]">Written</h2>
        {written.length === 0 ? (
          <div className="card-elevated p-6 text-sm text-[var(--color-text-secondary)]">
            You haven't written any reviews yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {written.map((r) => (
              <ReviewLi key={r.id} r={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewLi({ r }: { r: Row }) {
  return (
    <li className="card-elevated p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono">★ {r.rating}</span>
        <Badge variant="muted">{r.subject_kind}</Badge>
        <Badge variant="muted">{r.transaction_type}</Badge>
        {r.released_at ? (
          <Badge variant="success">released</Badge>
        ) : (
          <Badge variant="warning">hidden — waiting on counterpart</Badge>
        )}
      </div>
      {r.body && <p className="mt-2 text-sm whitespace-pre-wrap">{r.body}</p>}
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{formatDateTime(r.created_at)}</p>
    </li>
  );
}
