-- Give handovers and marketplace listings somewhere to put the photos their
-- forms have been advertising.
--
-- Both forms declare a Photos field and render the real capture control, so a
-- worker attaches photos and is told "2 photos attached". Neither had a column
-- to put them in:
--   handover  — the files were serialised correctly and `submitHandover`
--               never read them. Dropped server-side.
--   listing   — MarketView built its payload by naming four fields and
--               omitting `photo`. Dropped client-side, before the network.
-- Same lie as the original incident defect, reached two different ways.
--
-- jsonb (not a child table) to match `incidents.photos`: these are a handful
-- of refs read only with their parent row, and the PhotoRef shape is shared.

alter table public.handovers
  add column if not exists photos jsonb not null default '[]'::jsonb;

alter table public.marketplace_listings
  add column if not exists photos jsonb not null default '[]'::jsonb;

comment on column public.handovers.photos is
  'PhotoRef[] — {path, lat, lng, accuracyM, capturedAt}. Geotagged: a handover is site evidence and "where" is part of the report.';
comment on column public.marketplace_listings.photos is
  'PhotoRef[] — {path, ...}. NOT geotagged: a personal for-sale item has no operational need for the seller''s location, and recording it would be surveillance of a crew member''s own property. lat/lng stay null here by design.';

-- Refs are an array of objects; a scalar or bare string would break every
-- reader (normalisePhotoRefs tolerates legacy shapes, but nothing should be
-- writing them here from day one).
alter table public.handovers
  drop constraint if exists handovers_photos_is_array,
  add constraint handovers_photos_is_array check (jsonb_typeof(photos) = 'array');

alter table public.marketplace_listings
  drop constraint if exists marketplace_listings_photos_is_array,
  add constraint marketplace_listings_photos_is_array check (jsonb_typeof(photos) = 'array');
