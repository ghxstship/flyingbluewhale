-- Reconcile ref_expense_category to the canonical union of the studio seed
-- (av_rental/supplies/travel) and the live mobile expense form vocabulary
-- (Travel/Lodging/Meals/Fuel/Supplies/Equipment/Other). Additive, append-only.
-- APPLIED 2026-07-18 (ledger version 20260718132544).
insert into public.ref_expense_category (code, display_label, sort_order) values
  ('travel','Travel',10),
  ('lodging','Lodging',20),
  ('meals','Meals',30),
  ('fuel','Fuel',40),
  ('supplies','Supplies',50),
  ('equipment','Equipment',60),
  ('av_rental','AV Rental',70),
  ('other','Other',99)
on conflict (code) do update set
  display_label = excluded.display_label,
  sort_order = excluded.sort_order;

-- ===== DOWN (rollback) ========================================================
-- delete from public.ref_expense_category
--  where code in ('lodging','meals','fuel','equipment','other');
-- -- (travel/supplies/av_rental predate this migration; do not delete.)
