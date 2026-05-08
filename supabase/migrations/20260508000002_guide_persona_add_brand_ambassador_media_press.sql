-- ============================================================================
-- Extend guide_persona enum for the 8-counted-persona model.
-- ============================================================================
-- Adds two new values:
--   * brand_ambassador (tier 3, on-floor brand-aligned role staffed by an
--     external staffing vendor — Salvage City's 2026 vendor is Julia Valler
--     Inc supplying HOST I / HOST II / HOST VIP / FLEX. MERCH is absorbed
--     by the GHXSTSHIP PA-MERCH role on show days, not Julia Valler).
--   * media_press      (tier 4, embargo-bound press / photographer pool).
--
-- These extend the previous 7-persona model. Counted persona ordering on
-- the chip-bar (per src/app/(portal)/p/[slug]/guide/page.tsx):
--   1 staff (Production)
--   2 crew (Operations)
--   3 vendor (F&B)                 — tier 3
--   4 brand_ambassador             — tier 3
--   5 sponsor                      — tier 4
--   6 artist (Talent)              — tier 4
--   7 media_press                  — tier 4
--   8 guest                        — tier 5
--   - custom (Temporary Access)    — tier 5, parallel / uncounted
--   - client                       — tier 4, reserved (not surfaced)
--
-- Idempotent — IF NOT EXISTS guards against duplicate values.
-- ============================================================================

alter type guide_persona add value if not exists 'brand_ambassador';
alter type guide_persona add value if not exists 'media_press';
