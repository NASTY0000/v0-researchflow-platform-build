-- One-time fix: set is_active = true for any universities where it is NULL
UPDATE public.universities
SET is_active = true
WHERE is_active IS NULL;
