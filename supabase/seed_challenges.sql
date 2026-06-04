-- ════════════════════════════════════════════════════════════════════════════════
-- SAMPLE CHALLENGES SEED DATA
-- ════════════════════════════════════════════════════════════════════════════════

INSERT INTO challenges 
  (title, description, research_area, 
   prize_description, prize_type, 
   max_team_size, min_team_size,
   submission_deadline, status,
   judging_criteria)
VALUES
(
  'Climate Adaptation in West Africa',
  'Design a research framework addressing the impact of climate change on agricultural practices in West African communities. Consider sustainable farming techniques, water resource management, and community resilience strategies.',
  'Environmental Science',
  'Publication opportunity in the African Journal of Climate Research + 3-month mentorship with a senior researcher',
  'mixed',
  4, 1,
  (now() + interval '21 days')::timestamptz,
  'open',
  '{"criteria": [
    {"name": "Innovation", "weight": 30},
    {"name": "Feasibility", "weight": 25},
    {"name": "Impact", "weight": 30},
    {"name": "Presentation", "weight": 15}
  ]}'::jsonb
),
(
  'Public Health Data Challenge',
  'Analyse existing health datasets to identify patterns in disease burden across Nigerian states and propose evidence-based interventions. Use publicly available epidemiological data.',
  'Public Health',
  'Certificate of Excellence + featured in ResearchFlow Showcase + Akili Score bonus',
  'certificate',
  3, 1,
  (now() + interval '14 days')::timestamptz,
  'open',
  '{"criteria": [
    {"name": "Innovation", "weight": 25},
    {"name": "Feasibility", "weight": 25},
    {"name": "Impact", "weight": 35},
    {"name": "Presentation", "weight": 15}
  ]}'::jsonb
),
(
  'AI for African Languages',
  'Develop a research proposal for applying natural language processing to an African language of your choice. Include methodology, resources needed, and potential impact.',
  'Computer Science',
  'Mentorship session with an AI researcher + presentation opportunity at a virtual seminar',
  'mentorship',
  4, 1,
  (now() + interval '30 days')::timestamptz,
  'open',
  '{"criteria": [
    {"name": "Innovation", "weight": 40},
    {"name": "Feasibility", "weight": 20},
    {"name": "Impact", "weight": 25},
    {"name": "Presentation", "weight": 15}
  ]}'::jsonb
);
