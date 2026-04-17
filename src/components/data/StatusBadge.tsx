/* ═══════════════════════════════════════════════════════
   StatusBadge — Canonical status/type badge
   Single Source of Truth for ALL status→color mappings.
   Replaces per-page statusBg/statusColor/typeColors maps
   across deliverables, fulfillment, schedules, credentials,
   allocations, and vendor pages.
   ═══════════════════════════════════════════════════════ */

import { Badge, type BadgeVariant } from '../ui/Badge';

/* ─── Status Color Registry ─── */

const STATUS_MAP: Record<string, { variant: BadgeVariant; label?: string }> = {
  /* Deliverable statuses */
  draft:                { variant: 'muted' },
  submitted:            { variant: 'info' },
  in_review:            { variant: 'purple' },
  approved:             { variant: 'success' },
  rejected:             { variant: 'error' },
  revision_requested:   { variant: 'warning', label: 'Revision Requested' },

  /* Allocation states */
  reserved:             { variant: 'purple' },
  confirmed:            { variant: 'info' },
  in_transit:           { variant: 'warning' },
  on_site:              { variant: 'success' },
  returned:             { variant: 'muted' },
  maintenance:          { variant: 'error' },

  /* Fulfillment statuses */
  pending:              { variant: 'muted' },
  packing:              { variant: 'info' },
  packed:               { variant: 'purple' },
  delivered:            { variant: 'success' },
  completed:            { variant: 'cyan' },

  /* Schedule statuses */
  requested:            { variant: 'muted' },
  scheduled:            { variant: 'info' },
  in_progress:          { variant: 'cyan' },
  cancelled:            { variant: 'muted' },
  no_show:              { variant: 'error' },

  /* Credential statuses */
  issued:               { variant: 'success' },
  picked_up:            { variant: 'cyan' },
  revoked:              { variant: 'error' },
  denied:               { variant: 'error' },

  /* Schedule types */
  pickup:               { variant: 'warning' },
  delivery:             { variant: 'success' },
  transfer:             { variant: 'purple' },
  vendor_return:        { variant: 'error', label: 'Vendor Return' },
  will_call:            { variant: 'info', label: 'Will Call' },

  /* Vendor types */
  supplier:             { variant: 'info' },
  carrier:              { variant: 'purple' },
  rental_house:         { variant: 'cyan', label: 'Rental House' },
  freelancer:           { variant: 'success' },
  other:                { variant: 'muted' },

  /* Priority levels */
  low:                  { variant: 'muted' },
  normal:               { variant: 'default' },
  high:                 { variant: 'warning' },
  urgent:               { variant: 'error' },

  /* Project statuses */
  active:               { variant: 'success' },
  archived:             { variant: 'muted' },
  
  /* PO Statuses */
  acknowledged:         { variant: 'purple' },
  partially_received:   { variant: 'warning', label: 'Partially Received' },
  received:             { variant: 'success' },
  closed:               { variant: 'cyan' },
  
  /* Shipment Statuses & Directions */
  booked:               { variant: 'muted' },
  label_created:        { variant: 'info', label: 'Label Created' },
  out_for_delivery:     { variant: 'warning', label: 'Out for Delivery' },
  exception:            { variant: 'error' },
  inbound:              { variant: 'success' },
  outbound:             { variant: 'info' },
  inter_location:       { variant: 'purple', label: 'Inter-Location' },

  /* Asset statuses */
  available:            { variant: 'success' },
  allocated:            { variant: 'info' },
  checked_out:          { variant: 'warning', label: 'Checked Out' },
  lost:                 { variant: 'error' },
  retired:              { variant: 'muted' },
};

interface StatusBadgeProps {
  status: string;
  /** Optional label override; defaults to humanized status string */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { variant: 'default' as BadgeVariant };
  const displayLabel = label ?? config.label ?? status.replace(/_/g, ' ');

  return (
    <Badge variant={config.variant} className={className}>
      {displayLabel}
    </Badge>
  );
}
