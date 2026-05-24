-- Unified Assignment Domain — Step 7/7
-- Inventory view + notification taxonomy aligned with the new model.
--
-- v_catalog_inventory replaces the denormalized ticket_types.sold counter
-- with a live aggregate over assignments. Same shape for every catalog
-- kind: tickets, credentials, lodging, vehicles, etc.
--
-- notification_kind_catalog (from 0051) rewritten so /m/settings/
-- notifications shows assignment-aware toggles in place of the
-- legacy 'advancing' / 'advancing_state' kinds.

-- ============================================================
-- 1. v_catalog_inventory
-- ============================================================

CREATE OR REPLACE VIEW public.v_catalog_inventory AS
SELECT
  c.id              AS catalog_item_id,
  c.org_id,
  c.kind            AS catalog_kind,
  c.code,
  c.name,
  c.inventory_qty   AS allocated,
  COUNT(a.*) FILTER (WHERE a.fulfillment_state IN ('issued','transferred','briefed','draft','submitted','in_review','revision_requested','approved'))::int  AS open_count,
  COUNT(a.*) FILTER (WHERE a.fulfillment_state IN ('redeemed','delivered','returned'))::int  AS fulfilled_count,
  COUNT(a.*) FILTER (WHERE a.fulfillment_state IN ('voided','rejected','expired'))::int      AS cancelled_count,
  COUNT(a.*) FILTER (WHERE a.deleted_at IS NULL)::int                                         AS total_count,
  CASE
    WHEN c.inventory_qty IS NULL THEN NULL
    ELSE c.inventory_qty - COUNT(a.*) FILTER (WHERE a.fulfillment_state IN ('issued','transferred','redeemed','delivered'))::int
  END AS available_count
FROM public.master_catalog_items c
LEFT JOIN public.assignments a
  ON a.catalog_item_id = c.id AND a.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.org_id, c.kind, c.code, c.name, c.inventory_qty;

ALTER VIEW public.v_catalog_inventory SET (security_invoker = true);
GRANT SELECT ON public.v_catalog_inventory TO authenticated;

COMMENT ON VIEW public.v_catalog_inventory IS
  'Live inventory rollup: per master_catalog_items row, count of assignments by fulfillment_state bucket. Replaces the denormalized ticket_types.sold counter; same shape for every catalog kind.';

-- ============================================================
-- 2. Refresh notification_kind_catalog with assignment-aware taxonomy
-- ============================================================

CREATE OR REPLACE VIEW public.notification_kind_catalog AS
SELECT * FROM (VALUES
  ('announcement',        'Updates',           'Org-wide announcements'),
  ('chat',                'Chat',              'Direct messages and channels'),
  ('kudos',               'Kudos',             'Recognition posts'),
  ('badge',               'Badges',            'Awards from your org'),
  ('assignment',          'Assignments',       'New tickets, credentials, and advancing items assigned to you'),
  ('assignment_state',    'Assignment state',  'State changes on assignments you own'),
  ('assignment_scan',     'Scans',             'Your ticket or credential was scanned'),
  ('shift_swap',          'Shift Swap',        'Swap request decisions'),
  ('time_off',            'Time Off',          'Time-off request decisions'),
  ('course',              'Courses',           'Course assignments + pass results'),
  ('incident',            'Incidents',         'Field incident updates (manager+ only)')
) AS t(kind, label, description);

COMMENT ON VIEW public.notification_kind_catalog IS
  'Canonical event-kind list rendered as toggles on /m/settings/notifications. Renamed advancing → assignment in 0067 to match the unified assignment domain.';

GRANT SELECT ON public.notification_kind_catalog TO authenticated;
