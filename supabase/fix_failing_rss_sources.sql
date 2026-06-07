-- Fix failing RSS source URLs
-- Run in Supabase SQL Editor, then re-trigger ingestion to verify each returns > 0

-- 1. Check current state first
SELECT name, url, stream_category, last_fetched_at
FROM feed_content_sources
WHERE name IN (
  'Nature News',
  'SciDev Net Africa',
  'African Journals Online',
  'Research Africa',
  'arXiv Computer Science',
  'arXiv Biology',
  'medRxiv',
  'arXiv Economics',
  'FindAPhD Africa',
  'Academic Positions Africa',
  'Scholarship Positions'
);

-- 2. Apply known-URL fixes (verify these work after ingestion — not validated from this environment)
UPDATE feed_content_sources
SET url = 'https://www.nature.com/news.rss'
WHERE name = 'Nature News';

UPDATE feed_content_sources
SET url = 'https://www.scidev.net/global/feed/'
WHERE name = 'SciDev Net Africa';

-- NOTE: arXiv RSS requires specific subcategory codes (e.g. cs.AI, q-bio.BM, econ.EM),
-- not bare top-level categories. Confirm/replace with the correct subcategory before relying on these.
UPDATE feed_content_sources
SET url = 'https://arxiv.org/rss/cs'
WHERE name = 'arXiv Computer Science';

UPDATE feed_content_sources
SET url = 'https://arxiv.org/rss/q-bio'
WHERE name = 'arXiv Biology';

UPDATE feed_content_sources
SET url = 'https://arxiv.org/rss/econ'
WHERE name = 'arXiv Economics';

UPDATE feed_content_sources
SET url = 'https://connect.biorxiv.org/medrxiv_xml.php?subject=all'
WHERE name = 'medRxiv';

-- 3. Still need replacement URLs (no fix applied — research and update manually):
--    African Journals Online
--    Research Africa
--    FindAPhD Africa
--    Academic Positions Africa
--    Scholarship Positions

-- 4. Re-check after running ingestion
SELECT name, url, stream_category, last_fetched_at
FROM feed_content_sources
WHERE name IN (
  'Nature News',
  'SciDev Net Africa',
  'African Journals Online',
  'Research Africa',
  'arXiv Computer Science',
  'arXiv Biology',
  'medRxiv',
  'arXiv Economics',
  'FindAPhD Africa',
  'Academic Positions Africa',
  'Scholarship Positions'
);
