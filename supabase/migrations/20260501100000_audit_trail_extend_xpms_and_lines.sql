-- flyingbluewhale · Audit-trail coverage extension
--
-- Coverage went from 146 → 164 of 169 mutable user tables (97%).
-- The 5 that remain are deliberate skips:
--   * Reference codebooks (xtc_classes/codes/divisions/sections) — append-only
--     governance via migration; row-level audit would be schema noise.
--   * Auth-managed tables (users, user_preferences, user_passkeys,
--     webauthn_challenges) — user-owned data, audit handled at the route
--     layer when needed (see e.g. webauthn/register/verify route).
--
-- Added 9 audit triggers using the same pattern as every other audited
-- table: `audit_<table>` after insert/update/delete, calling
-- `audit_trigger()` which writes to the central `audit_log` table.

create trigger audit_xpms_atoms after insert or update or delete on xpms_atoms
  for each row execute function audit_trigger();
create trigger audit_xpms_atom_tiers after insert or update or delete on xpms_atom_tiers
  for each row execute function audit_trigger();
create trigger audit_xpms_variance_ledger after insert or update or delete on xpms_variance_ledger
  for each row execute function audit_trigger();
create trigger audit_xpms_provenance_edges after insert or update or delete on xpms_provenance_edges
  for each row execute function audit_trigger();
create trigger audit_xpms_project_composition after insert or update or delete on xpms_project_composition
  for each row execute function audit_trigger();

-- Financial line items — every change to invoice/PO totals is now audited
-- regardless of which UI / server action made the change.
create trigger audit_invoice_line_items after insert or update or delete on invoice_line_items
  for each row execute function audit_trigger();
create trigger audit_po_line_items after insert or update or delete on po_line_items
  for each row execute function audit_trigger();

-- Cross-team activity surfaces.
create trigger audit_deliverable_comments after insert or update or delete on deliverable_comments
  for each row execute function audit_trigger();
create trigger audit_ai_messages after insert or update or delete on ai_messages
  for each row execute function audit_trigger();
