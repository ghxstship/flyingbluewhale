-- fbw_022 · Tier rename — portal → access, starter → core
--
-- Product positioning change: the free tier is now called "Access" (framed
-- as "Free for Life") and the entry-paid tier is "Core" (was "Starter").
-- Postgres enum rename is atomic + in-place — existing rows update without
-- a table rewrite because the enum value is stored by its OID, not the label.

alter type tier rename value 'portal' to 'access';
alter type tier rename value 'starter' to 'core';

comment on type tier is
  'Subscription tier (fbw_022): access (free) | core | professional | enterprise.';
