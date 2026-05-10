-- Bug #9 — `user_preferences_theme_check` was missing 'bermuda-triangle',
-- which is the default chroma theme shipped in src/app/theme/themes/.
-- Persisting any user's theme preference would 500 with check_violation.
-- Add it to the allowlist.
ALTER TABLE public.user_preferences
  DROP CONSTRAINT IF EXISTS user_preferences_theme_check;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_theme_check
  CHECK (theme = ANY (ARRAY[
    'bermuda-triangle'::text,
    'glass'::text,
    'brutal'::text,
    'bento'::text,
    'kinetic'::text,
    'copilot'::text,
    'cyber'::text,
    'soft'::text,
    'earthy'::text,
    'system'::text
  ]));
