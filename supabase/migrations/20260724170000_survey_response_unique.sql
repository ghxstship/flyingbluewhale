-- One response per attributed respondent per survey, DB-enforced.
--
-- The /m/surveys taker guards double-response with a select-then-insert app
-- check, which a concurrent double-submit can race. Anonymous responses
-- (respondent_id IS NULL) are exempt by design — anonymity makes
-- double-response undetectable, and NULLs never collide under the partial
-- index anyway. The taker does a plain INSERT (no upsert), so partial-index
-- inference is not needed.

create unique index survey_responses_one_per_respondent
  on public.survey_responses (survey_id, respondent_id)
  where respondent_id is not null;
