-- SOOT sync triggers for dual-lifecycle columns.
--
-- fabrication_orders has both status (text, 4 values) and production_phase (enum, 9
-- values) with no trigger keeping them in sync. production_phase is the canonical
-- LDP column; trigger derives status from it so legacy API consumers still work.
--
-- accounting_periods: audit confirmed only the canonical `state` enum column exists
-- (no legacy `status` column) — no sync trigger needed.

-- ─── fabrication_orders ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.tg_fabrication_orders_phase_to_status()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  NEW.status := CASE NEW.production_phase
    WHEN 'DISCOVERY'   THEN 'open'
    WHEN 'CONCEPT'     THEN 'open'
    WHEN 'ENGINEERING' THEN 'in_progress'
    WHEN 'PRE_PRO'     THEN 'in_progress'
    WHEN 'FAB'         THEN 'in_progress'
    WHEN 'LOGISTICS'   THEN 'in_progress'
    WHEN 'INSTALL'     THEN 'in_progress'
    WHEN 'STRIKE'      THEN 'complete'
    WHEN 'ARCHIVED'    THEN 'complete'
    ELSE NEW.status
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fabrication_orders_phase_to_status ON public.fabrication_orders;
CREATE TRIGGER trg_fabrication_orders_phase_to_status
  BEFORE INSERT OR UPDATE OF production_phase ON public.fabrication_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_fabrication_orders_phase_to_status();

COMMENT ON FUNCTION public.tg_fabrication_orders_phase_to_status() IS
  'SOOT sync: production_phase is canonical; status is derived. Write production_phase.';

-- ─── campaigns.spent_cents safeguard ─────────────────────────────────────────

COMMENT ON COLUMN public.campaigns.spent_cents IS
  'Denormalized spend total. Must be maintained by application writes through
   sync_campaign_spent(). Do NOT update from application code directly.
   TODO: wire a trigger analogous to tg_sync_budget_spent_on_expense once the
   campaign-to-expense foreign key is formalized.';

-- ─── talent_offers.co_pro_partners ───────────────────────────────────────────

COMMENT ON COLUMN public.talent_offers.co_pro_partners IS
  'DEPRECATED SHADOW — co_pro_partnerships table (0003) is the SSOT for
   co-promoter splits. This JSONB column has no sync trigger and will diverge.
   TODO: migrate existing JSONB entries into co_pro_partnerships rows, then
   run: ALTER TABLE public.talent_offers DROP COLUMN co_pro_partners;';
