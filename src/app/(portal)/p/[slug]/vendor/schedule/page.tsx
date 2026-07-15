import { ScheduleSurface } from "@/components/workforce/ScheduleSurface";

/**
 * GVTEWAY vendor schedule (ADR-0008 Move 3) — thin wrapper over the
 * shared <ScheduleSurface>.
 *
 * `clockIn: "none"` is why the disposition is a required union member rather
 * than an optional href. The `partner` band is `{gvteway: full, cvrgo: ro}`
 * (src/lib/entitlements.json): a vendor has no COMPVSS reach at all, so the
 * old "Check in" CTA invited them into an app they cannot enter — the same
 * defect class as the GVTEWAY Onsite tab in the COMPVSS bar, pointing the
 * other way. Vendors don't punch a clock regardless; their time reaches us
 * through POs and invoices.
 *
 * Swap requests still file inline: a vendor's crew can be rostered onto
 * shifts, and asking to be swapped off one is a form, not a field capability.
 */
export const dynamic = "force-dynamic";

export default async function VendorSchedulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <ScheduleSurface
      variant="portal"
      clockIn="none"
      revalidate={`/p/${slug}/vendor/schedule`}
      eyebrowLabel="Vendor"
      titleLabel="Schedule"
    />
  );
}
