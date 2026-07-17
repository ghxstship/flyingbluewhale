INSERT INTO "public"."feature_flags" ("flag_key", "description", "owner", "expires_at", "default_value", "rollout_strategy")
VALUES (
  'compvss.asset_self_checkout',
  'COMPVSS: allow the member band to check assets out to themselves and back in. Never grants any other lifecycle move — retire/maintenance stay manager+ regardless. Per-org via feature_flag_cohorts.',
  'compvss',
  '2030-01-01T00:00:00Z',
  false,
  '{"kind": "org_cohort"}'::jsonb
)
ON CONFLICT ("flag_key") DO UPDATE
  SET "description" = EXCLUDED."description",
      "rollout_strategy" = EXCLUDED."rollout_strategy";
