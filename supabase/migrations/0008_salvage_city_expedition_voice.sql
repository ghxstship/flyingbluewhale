-- ============================================================================
-- Salvage City — expedition-brief voice for the welcome message
-- ============================================================================
-- Per Julian (2026-05-06): the engagement letter prose was reading too terse.
-- Reset to an expedition-brief tone — formal, warm, welcoming, with operator
-- vernacular and acknowledgement of the work ahead.
-- ============================================================================

update projects set welcome_message =
'Welcome aboard. You''re joining a small, deliberate crew building an immersive supper club inside the largest electronic-dance festival in the world — five seatings a night, eighty guests at a time, three nights only. The work is precise, occasionally beautiful, and genuinely fun when the cues land clean. The pages that follow are your full brief: who you are on the crew, what you''ll be paid, when and where to show up, what to bring, what we''re asking of you on site, and what you can expect from us in return. Read it carefully. Bring questions. We''re glad you''re with us.'
where slug = 'edclv26-salvage-city';
