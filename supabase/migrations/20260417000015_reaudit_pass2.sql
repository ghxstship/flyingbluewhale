-- ═══════════════════════════════════════════════════════
-- RED SEA LION Migration 015: Re-Audit Pass 2
-- Closes GAP-043: Missing 'vendor' in portal_track enum
-- ═══════════════════════════════════════════════════════

-- The vendor portal track exists as a directory, is in ROLE_TRACK_MAP,
-- but was never added to the portal_track enum. CMS pages cannot
-- be assigned to the vendor track without this.
alter type portal_track add value if not exists 'vendor';
