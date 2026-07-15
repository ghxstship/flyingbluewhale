-- Field photo geotagging — capture location for COMPVSS site photos.
--
-- `incidents.photos` is jsonb and already carries the geotag inside each
-- PhotoRef, so it needs no migration. `daily_log_photos` is a real table and
-- had nowhere to put one, which meant a site photo could say what was wrong
-- but not where — on the exact surface (daily logs) where "where" is the
-- question being asked.
--
-- `project_photos` already has lat/lng from the baseline; this brings the
-- daily-log store to the same shape and adds the accuracy both were missing.
--
-- All columns are nullable by design. The fix is best-effort: a denied
-- permission or an indoor dead-zone records NULL rather than blocking a
-- field submit. NULL means "no fix", never "at 0,0".

alter table public.daily_log_photos
  add column if not exists lat numeric,
  add column if not exists lng numeric,
  add column if not exists accuracy_m numeric;

alter table public.project_photos
  add column if not exists accuracy_m numeric;

comment on column public.daily_log_photos.lat is
  'Device latitude reported when the photo was attached. NULL = no fix available. Attested by the device at capture, not read from EXIF.';
comment on column public.daily_log_photos.lng is
  'Device longitude reported when the photo was attached. NULL = no fix available.';
comment on column public.daily_log_photos.accuracy_m is
  'Fix radius in metres (68% confidence). Read this before trusting lat/lng: a 2000m tower triangulation is not evidence of location.';
comment on column public.project_photos.accuracy_m is
  'Fix radius in metres (68% confidence) for lat/lng. NULL = unknown accuracy.';

-- Reject impossible coordinates at the boundary. The app validates too, but
-- a bad client shipping 0,0 or a swapped lat/lng would otherwise render as a
-- confident pin in the Gulf of Guinea.
alter table public.daily_log_photos
  drop constraint if exists daily_log_photos_lat_range,
  add constraint daily_log_photos_lat_range check (lat is null or (lat >= -90 and lat <= 90));

alter table public.daily_log_photos
  drop constraint if exists daily_log_photos_lng_range,
  add constraint daily_log_photos_lng_range check (lng is null or (lng >= -180 and lng <= 180));

alter table public.daily_log_photos
  drop constraint if exists daily_log_photos_accuracy_nonneg,
  add constraint daily_log_photos_accuracy_nonneg check (accuracy_m is null or accuracy_m >= 0);
