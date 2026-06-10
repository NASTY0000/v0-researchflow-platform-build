-- Fix Akili point inflation on challenges.
-- challenge_submitted now awards a flat 25 pts (participation) and
-- challenge_won awards a flat 150 pts (first place) — see lib/actions/challenges.ts.
-- Bring the displayed akili_reward in line with the actual participation reward
-- so the UI ("+{akili_reward} Akili pts on submission") matches what's awarded.
UPDATE challenges
SET akili_reward = 25
WHERE akili_reward > 25;
