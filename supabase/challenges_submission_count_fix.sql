-- Fix: challenge submissions failing with "Challenge not found".
--
-- The base `challenges` table (created by v0) never had a `submission_count`
-- column, and no migration in this repo adds it (challenges_v2_migration.sql
-- assumed it already existed). Any query that explicitly selected
-- `submission_count` was rejected by PostgREST, which the app surfaced as
-- "Challenge not found" even though the challenge row exists.
--
-- Safe to run multiple times.

ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0;

-- Backfill from actual submissions
UPDATE challenges c
SET submission_count = sub.cnt
FROM (
  SELECT challenge_id, COUNT(*) AS cnt
  FROM challenge_submissions
  GROUP BY challenge_id
) sub
WHERE sub.challenge_id = c.id;

UPDATE challenges SET submission_count = 0 WHERE submission_count IS NULL;
