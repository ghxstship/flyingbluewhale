import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { MEAL_CATEGORY_LABELS } from "@/lib/open-shifts";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24">
        <h1 className="text-display mt-2 text-3xl">{t("m.meals.title", undefined, "Meals")}</h1>
        <div className="card-elevated mt-6 p-4 text-sm">Configure Supabase.</div>
      </div>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: tickets } = await supabase
    .from("meal_tickets")
    .select("id, meal_category, meal_date, is_redeemed, redeemed_at, qr_token, notes")
    .eq("holder_id", session.userId)
    .gte("meal_date", today)
    .order("meal_date", { ascending: true })
    .order("meal_category")
    .limit(100);

  type Ticket = {
    id: string; meal_category: string; meal_date: string;
    is_redeemed: boolean; redeemed_at: string | null; qr_token: string | null; notes: string | null;
  };

  const allTickets = (tickets ?? []) as Ticket[];
  const todayTickets = allTickets.filter((t) => t.meal_date === today);
  const upcomingTickets = allTickets.filter((t) => t.meal_date > today);

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">
        {t("m.meals.eyebrow", undefined, "Catering")}
      </div>
      <h1 className="text-display mt-2 text-3xl">{t("m.meals.title", undefined, "Meal Tickets")}</h1>

      {allTickets.length === 0 ? (
        <div className="card-elevated mt-6 p-6 text-center">
          <p className="text-sm font-medium">{t("m.meals.empty.label", undefined, "No meal tickets")}</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {t("m.meals.empty.desc", undefined, "Your catering tickets will appear here once issued.")}
          </p>
        </div>
      ) : (
        <>
          {todayTickets.length > 0 && (
            <section className="mt-5">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                {t("m.meals.today", undefined, "Today")}
              </p>
              <ul className="space-y-3">
                {todayTickets.map((ticket) => (
                  <MealTicketCard key={ticket.id} ticket={ticket} />
                ))}
              </ul>
            </section>
          )}

          {upcomingTickets.length > 0 && (
            <section className="mt-6">
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
                {t("m.meals.upcoming", undefined, "Upcoming")}
              </p>
              <ul className="space-y-3">
                {upcomingTickets.map((ticket) => (
                  <MealTicketCard key={ticket.id} ticket={ticket} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

type MealTicketCardProps = {
  ticket: {
    id: string; meal_category: string; meal_date: string;
    is_redeemed: boolean; redeemed_at: string | null; qr_token: string | null; notes: string | null;
  };
};

function MealTicketCard({ ticket }: MealTicketCardProps) {
  const categoryLabel =
    MEAL_CATEGORY_LABELS[ticket.meal_category as keyof typeof MEAL_CATEGORY_LABELS] ?? ticket.meal_category;

  return (
    <li className={`card-elevated p-4 ${ticket.is_redeemed ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold">{categoryLabel}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {new Date(ticket.meal_date + "T12:00:00").toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          {ticket.notes && (
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{ticket.notes}</p>
          )}
        </div>
        <div className="text-right">
          {ticket.is_redeemed ? (
            <span className="text-xs font-medium text-[var(--color-success)]">Redeemed</span>
          ) : (
            <span className="text-xs font-medium text-[var(--color-info)]">Outstanding</span>
          )}
        </div>
      </div>

      {/* QR token display — catering staff scan this */}
      {ticket.qr_token && !ticket.is_redeemed && (
        <div className="mt-3 rounded-lg bg-white p-3 flex flex-col items-center gap-2">
          {/* ASCII QR placeholder — in prod this would use a QR library or data URL */}
          <div
            className="font-mono text-xs text-center text-black select-all break-all leading-tight"
            aria-label="Meal ticket QR token"
          >
            {ticket.qr_token}
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">Show to catering staff</p>
        </div>
      )}
    </li>
  );
}
