-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 022a: Role Taxonomy — Enum Extension
-- Adds canonical role values to the existing platform_role enum.
-- This MUST run in a separate transaction from the data migration
-- because Postgres cannot use newly added enum values in the
-- same transaction where they were created.
--
-- Canonical Platform Roles (Internal):
--   developer, owner, admin, team_member, collaborator
-- Canonical Project Roles (External):
--   executive, production, management, crew, staff,
--   talent, vendor, client, sponsor, press, guest, attendee
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Add canonical role values to platform_role enum ═══

alter type platform_role add value if not exists 'collaborator';
alter type platform_role add value if not exists 'executive';
alter type platform_role add value if not exists 'production';
alter type platform_role add value if not exists 'management';
alter type platform_role add value if not exists 'crew';
alter type platform_role add value if not exists 'staff';
alter type platform_role add value if not exists 'talent';
alter type platform_role add value if not exists 'press';
alter type platform_role add value if not exists 'guest';
alter type platform_role add value if not exists 'attendee';

-- ═══ 2. Add new portal_track values ═══

alter type portal_track add value if not exists 'press';
alter type portal_track add value if not exists 'attendee';
alter type portal_track add value if not exists 'talent';
alter type portal_track add value if not exists 'crew';
alter type portal_track add value if not exists 'staff';
alter type portal_track add value if not exists 'management';
