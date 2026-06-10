-- akili_score_events was missing the `dimension`, `metadata`, and `related_id`
-- columns that lib/actions/akili.ts writes to (the original akili_score_migration.sql
-- only created `related_id`, but `dimension`/`metadata` were never added in a
-- tracked migration). Without these, awardAkiliPoints() inserts failed silently,
-- meaning no score events were ever recorded and no profile akili_* columns
-- were updated.
ALTER TABLE akili_score_events
  ADD COLUMN IF NOT EXISTS dimension TEXT,
  ADD COLUMN IF NOT EXISTS metadata  JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS related_id UUID;

CREATE INDEX IF NOT EXISTS idx_akili_events_related_id ON akili_score_events(related_id);
