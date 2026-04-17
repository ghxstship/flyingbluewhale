-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 045a: Extend Notification Channel Enum
-- Must be in a separate transaction from any usage of the new value
-- ═══════════════════════════════════════════════════════

alter type notification_channel add value if not exists 'in_app';
