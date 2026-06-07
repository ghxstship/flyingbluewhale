-- Proposal templates table + canonical 17-section system template.
--
-- Templates are reusable starting points for new proposals. Two flavors:
--
--   1. System templates (org_id IS NULL, is_system = true) — shipped by
--      the platform; every org sees them. The canonical 17-section
--      template seeded below is the SSOT structure all proposals are
--      expected to derive from. See reference_proposal_template.md for
--      the body convention.
--
--   2. Org-scoped templates (org_id NOT NULL, is_system = false) — an
--      org's own reusables (e.g. a client-specific deck shape). RLS
--      gates writes to manager+ via private.has_org_role.
--
-- `scope` is a free-text discriminator the UI can filter by ("general",
-- "activation", "tour", "film") — kept loose since template kinds are a
-- curatorial concern, not a schema invariant.

CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  scope text NOT NULL DEFAULT 'general',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  theme jsonb NOT NULL DEFAULT '{"primary": "#D4782A", "secondary": "#6D4A2A"}'::jsonb,
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- System templates are global (no org_id); org templates must have one.
  -- This rules out the silent fourth quadrant (system row + org_id set,
  -- which would imply per-org-system templates we don't yet support).
  CONSTRAINT proposal_templates_scope_check CHECK (
    (is_system = true AND org_id IS NULL)
    OR (is_system = false AND org_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_proposal_templates_org_scope
  ON public.proposal_templates(org_id, scope)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proposal_templates_system
  ON public.proposal_templates(scope)
  WHERE is_system = true AND deleted_at IS NULL;

CREATE OR REPLACE TRIGGER proposal_templates_touch_updated_at
  BEFORE UPDATE ON public.proposal_templates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- Read: org members see their org's rows + every system row.
DO $$ BEGIN
  CREATE POLICY proposal_templates_select ON public.proposal_templates
    FOR SELECT TO authenticated
    USING (
      is_system = true
      OR (org_id IS NOT NULL AND private.is_org_member(org_id))
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Write: manager+ within the org. System templates are write-protected
-- against authenticated users — only service role / migrations can
-- create or mutate them.
DO $$ BEGIN
  CREATE POLICY proposal_templates_insert ON public.proposal_templates
    FOR INSERT TO authenticated
    WITH CHECK (
      is_system = false
      AND org_id IS NOT NULL
      AND private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY proposal_templates_update ON public.proposal_templates
    FOR UPDATE TO authenticated
    USING (
      is_system = false
      AND org_id IS NOT NULL
      AND private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
    )
    WITH CHECK (
      is_system = false
      AND org_id IS NOT NULL
      AND private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY proposal_templates_delete ON public.proposal_templates
    FOR DELETE TO authenticated
    USING (
      is_system = false
      AND org_id IS NOT NULL
      AND private.has_org_role(org_id, ARRAY['owner','admin','manager']::text[])
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TABLE public.proposal_templates IS
  'Reusable proposal starting points. System rows (org_id NULL, is_system=true) are platform-shipped; org rows are tenant-authored. See src/lib/proposals/types.ts for the blocks shape and reference_proposal_template.md memory for the 17-section canon.';

-- ============================================================
-- Canonical 17-section system template
-- ============================================================
--
-- Idempotent via the NOT EXISTS guard so the migration can re-apply
-- without duplicating the seed row.
--
-- The blocks array below is a structural scaffold — every block carries
-- its canonical anchorId so seeding cross-references survive editing.
-- Content is intentionally placeholder; ops fork-and-fill in the editor.

INSERT INTO public.proposal_templates (id, org_id, name, description, scope, is_system, blocks)
SELECT
  gen_random_uuid(),
  NULL,
  'Canonical 17-Section Proposal',
  'SSOT 17-section structure: hero through footer, with the 8-phase Production Lifecycle and 60/40 engagement split. Every proposal should fork from this template.',
  'general',
  true,
  $blocks$[
    {"type":"hero","anchorId":"hero","eyebrow":"Proposal","title":"Project Title","subtitle":"One-line engagement summary","partners":["Client Brand"],"narrative":"Two-sentence framing of the engagement: what we're delivering, when, and the outcome it unlocks."},
    {"type":"prose","anchorId":"brand-narrative","body":"\"Standalone blockquote that anchors the deck's voice — short, declarative, attributable.\" — Producer"},
    {"type":"overview_cards","anchorId":"project-overview","cards":[
      {"tag":"Client","title":"Client Brand","details":[{"label":"Primary Contact","value":"Name, Title"},{"label":"Engagement","value":"Activation / Tour / Show"}]},
      {"tag":"Engagement","title":"Scope Summary","details":[{"label":"Dates","value":"TBD"},{"label":"Locations","value":"TBD"}]}
    ]},
    {"type":"phase","anchorId":"scope-of-work","num":"SOW","name":"Scope of Work","narrative":"11-node accordion: 6 Fabrication & Print + 5 Production Services. Each child is a `phase` block or a structured line item.","items":[]},
    {"type":"capabilities","anchorId":"activation-sites","cards":[{"title":"Activation Site 1","body":"Footprint, capacity, and zone notes."}]},
    {"type":"phase","anchorId":"production-lifecycle","num":1,"name":"Discovery & Brief","xpmsPhase":"discovery","narrative":"Kickoff, brief intake, stakeholder alignment.","deliverables":[{"label":"Creative brief","deliverableType":"custom"},{"label":"Stakeholder map","deliverableType":"custom"}],"gate":{"title":"Approval Gate","items":["Client sign-off on brief"],"unlocks":"Concept & Design"}},
    {"type":"phase","num":2,"name":"Concept & Design","xpmsPhase":"concept","narrative":"Visual direction, design boards, technical sketches.","deliverables":[{"label":"Concept boards","deliverableType":"custom"},{"label":"Site plan v1","deliverableType":"site_plan"}],"gate":{"title":"Approval Gate","items":["Client sign-off on concept"],"unlocks":"Engineering & Documentation"}},
    {"type":"phase","num":3,"name":"Engineering & Documentation","xpmsPhase":"development","narrative":"Build drawings, rigging plans, power plans.","deliverables":[{"label":"Rigging plan","deliverableType":"rigging_plan"},{"label":"Power plan","deliverableType":"power_plan"},{"label":"Build schedule","deliverableType":"build_schedule"}],"gate":{"title":"Approval Gate","items":["Engineer of record sign-off"],"unlocks":"Pre-Production & Procurement"}},
    {"type":"phase","num":4,"name":"Pre-Production & Procurement","xpmsPhase":"advance","narrative":"Vendor lock, equipment pulls, advance.","deliverables":[{"label":"Equipment pull list","deliverableType":"equipment_pull_list"},{"label":"Vendor package","deliverableType":"vendor_package"},{"label":"Technical rider","deliverableType":"technical_rider"}],"gate":{"title":"Approval Gate","items":["Procurement complete"],"unlocks":"Fabrication & Print"}},
    {"type":"phase","num":5,"name":"Fabrication & Print","xpmsPhase":"build","narrative":"Build, paint, print, assemble.","deliverables":[{"label":"Signage grid","deliverableType":"signage_grid"},{"label":"QA punch list","deliverableType":"custom"}],"items":[],"gate":{"title":"Approval Gate","items":["QA pass on all components"],"unlocks":"Logistics & Transport"}},
    {"type":"phase","num":6,"name":"Logistics & Transport","xpmsPhase":"build","narrative":"Truck pack, transport, on-site receipt.","deliverables":[{"label":"Comms plan","deliverableType":"comms_plan"},{"label":"Safety/compliance docs","deliverableType":"safety_compliance"}],"gate":{"title":"Approval Gate","items":["On-site receipt confirmed"],"unlocks":"Install & Activation"}},
    {"type":"phase","num":7,"name":"Install & Activation","xpmsPhase":"show","narrative":"Load-in, install, show calls, activation.","deliverables":[{"label":"Crew list","deliverableType":"crew_list"},{"label":"Stage plot","deliverableType":"stage_plot"},{"label":"Input list","deliverableType":"input_list"}],"gate":{"title":"Approval Gate","items":["Show open"],"unlocks":"Strike & Closeout"}},
    {"type":"phase","num":8,"name":"Strike & Closeout","xpmsPhase":"strike","narrative":"Tear-down, return logistics, project closeout.","deliverables":[{"label":"Closeout report","deliverableType":"custom"}],"gate":{"title":"Approval Gate","items":["Final invoice approved"],"unlocks":"Wrap"}},
    {"type":"schedule_table","anchorId":"workback-schedule","rows":[{"phase":"Discovery","milestone":"Kickoff","date":"TBD"}]},
    {"type":"investment_table","anchorId":"investment-summary","groups":[
      {"label":"Fabrication & Print","budgetCategory":"Fabrication","items":[{"name":"Placeholder line","price":{"cents":0},"qty":1,"unit":"ea"}]},
      {"label":"Production Services","budgetCategory":"Production","items":[{"name":"Placeholder line","price":{"cents":0},"qty":1,"unit":"day"}]}
    ],"total":{"cents":0},"taxNote":"Plus applicable taxes"},
    {"type":"total_block","label":"Total Investment","amount":{"cents":0}},
    {"type":"engagement_split","anchorId":"engagement-bar","depositPercent":60,"balancePercent":40,"depositLabel":"Deposit on Signature","balanceLabel":"Balance on Load-In"},
    {"type":"payment_method","anchorId":"payment-method","method":"ach","details":{"Beneficiary":"Your Company LLC","Routing":"Wire on request","Account":"Wire on request"}},
    {"type":"change_orders","anchorId":"change-orders","items":[{"name":"Optional Scope Item","description":"Quoted separately on activation."}]},
    {"type":"exclusions","anchorId":"exclusions","items":[{"term":"Out of Scope","body":"Items not included in this engagement."}]},
    {"type":"terms_grid","anchorId":"terms","items":[
      {"section":"1","title":"Payment Terms","body":"60% deposit on signature; 40% balance on load-in."},
      {"section":"2","title":"Cancellation","body":"Deposit non-refundable after 14 days from signature."},
      {"section":"3","title":"Force Majeure","body":"Standard force majeure clause applies."},
      {"section":"4","title":"IP","body":"Producer retains rights to process and methodology; client owns deliverables on final payment."},
      {"section":"5","title":"Liability","body":"Liability capped at total engagement amount."},
      {"section":"6","title":"Governing Law","body":"Governed by the laws of the producer's jurisdiction."}
    ]},
    {"type":"signature_block","anchorId":"authorization","parties":[{"role":"Client"},{"role":"Producer"}],"instructions":"Draw or type your full legal name. Title and date auto-stamp on submit."},
    {"type":"cta","anchorId":"cta-row","label":"Email Producer","href":"mailto:hello@example.com","variant":"primary"},
    {"type":"prose","anchorId":"footer","body":"© Your Company · All rights reserved."}
  ]$blocks$::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.proposal_templates
  WHERE is_system = true AND name = 'Canonical 17-Section Proposal'
);
