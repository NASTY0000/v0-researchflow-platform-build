// Comprehensive Research Interests, Skills, and Collaborator types

export const RESEARCH_INTERESTS = {
  'Medical & Health Sciences': [
    'Anatomy', 'Physiology', 'Biochemistry', 'Pharmacology', 'Microbiology', 'Pathology',
    'Haematology', 'Immunology', 'Medical Laboratory Science', 'Nursing Science', 'Radiography',
    'Physiotherapy', 'Public Health', 'Epidemiology', 'Global Health', 'Community Health',
    'Environmental Health', 'Nutrition and Dietetics', 'Medical Sociology', 'Health Informatics',
    'One Health', 'Tropical Medicine', 'Parasitology', 'Virology', 'Bacteriology', 'Medical Mycology',
    'Reproductive Health', 'Maternal Health', 'Child Health', 'Geriatrics', 'Oncology', 'Neuroscience',
    'Cardiology', 'Nephrology', 'Endocrinology', 'Dermatology', 'Ophthalmology', 'Orthopaedics',
    'Surgery Research', 'Anaesthesia', 'Dentistry', 'Optometry', 'Medical Education',
  ],
  'Basic Sciences': [
    'Biology', 'Zoology', 'Botany', 'Genetics', 'Molecular Biology', 'Cell Biology', 'Ecology',
    'Marine Biology', 'Entomology', 'Evolutionary Biology', 'Chemistry', 'Organic Chemistry',
    'Inorganic Chemistry', 'Analytical Chemistry', 'Physical Chemistry', 'Biochemistry',
    'Industrial Chemistry', 'Physics', 'Applied Physics', 'Astrophysics', 'Geophysics', 'Optics',
    'Nuclear Physics', 'Mathematics', 'Statistics', 'Applied Mathematics', 'Computational Mathematics',
  ],
  'Engineering & Technology': [
    'Electrical Engineering', 'Electronic Engineering', 'Mechanical Engineering', 'Civil Engineering',
    'Chemical Engineering', 'Petroleum Engineering', 'Biomedical Engineering', 'Agricultural Engineering',
    'Computer Engineering', 'Software Engineering', 'Systems Engineering', 'Robotics', 'Mechatronics',
    'Telecommunications', 'Aerospace Engineering', 'Environmental Engineering', 'Structural Engineering',
    'Water Resources Engineering',
  ],
  'Computing & Data': [
    'Computer Science', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning',
    'Natural Language Processing', 'Computer Vision', 'Data Science', 'Data Analytics', 'Big Data',
    'Bioinformatics', 'Computational Biology', 'Health Informatics', 'Cybersecurity',
    'Blockchain Technology', 'Internet of Things (IoT)', 'Cloud Computing', 'Software Development',
    'Human-Computer Interaction', 'Web Technologies', 'Mobile Development', 'Database Systems',
  ],
  'Agriculture & Environment': [
    'Agriculture', 'Agronomy', 'Animal Science', 'Crop Science', 'Soil Science', 'Horticulture',
    'Aquaculture', 'Fisheries', 'Forestry', 'Food Science and Technology', 'Food Safety',
    'Agricultural Economics', 'Rural Development', 'Climate Change', 'Environmental Science',
    'Conservation Biology', 'Renewable Energy', 'Waste Management', 'Water Science',
  ],
  'Social Sciences & Humanities': [
    'Psychology', 'Sociology', 'Anthropology', 'Political Science', 'Public Administration',
    'International Relations', 'Economics', 'Development Economics', 'Behavioural Science',
    'Geography', 'Urban Planning', 'History', 'Philosophy', 'Education', 'Linguistics',
    'Communication Studies', 'Media Studies', 'Gender Studies', 'Peace and Conflict Studies',
  ],
  'Business & Innovation': [
    'Entrepreneurship', 'Business Administration', 'Finance', 'Accounting', 'Marketing', 'Management',
    'Innovation Studies', 'Technology Management', 'Health Economics', 'Social Enterprise',
  ],
  'Law & Policy': [
    'Law', 'Medical Law and Ethics', 'Health Policy', 'Science Policy', 'Intellectual Property',
    'Human Rights', 'Environmental Law',
  ],
}

export const ALL_RESEARCH_INTERESTS = Object.values(RESEARCH_INTERESTS).flat()

export const SKILLS_OFFERED = [
  // Statistical Analysis
  'Statistical Analysis (SPSS)', 'Statistical Analysis (R)', 'Statistical Analysis (Python)',
  // Research Methods
  'Systematic Review', 'Meta-Analysis', 'Qualitative Research', 'Quantitative Research',
  'Mixed Methods Research', 'Survey Design', 'Questionnaire Design', 'Focus Group Facilitation',
  'Interview Research', 'Data Collection', 'Data Cleaning', 'Data Visualisation',
  // Laboratory Skills
  'Laboratory Skills (Wet Lab)', 'Laboratory Skills (Dry Lab)',
  'Molecular Techniques (PCR, Gel Electrophoresis)', 'Histology and Tissue Processing',
  'Microscopy', 'Medical Imaging Analysis', 'Cell Culture', 'Animal Handling', 'Field Research',
  // Technical Skills
  'GIS and Mapping', 'Bioinformatics', 'Genomics Analysis', 'Proteomics',
  'Programming (Python)', 'Programming (R)', 'Programming (MATLAB)', 'Programming (Java)',
  'Programming (JavaScript)', 'Web Development', 'Mobile App Development', 'Database Management (SQL)',
  'Machine Learning Implementation', 'AI Model Training',
  // Writing & Communication
  'Literature Review', 'Systematic Searching (PubMed/Scopus)', 'Academic Writing', 'Scientific Writing',
  'Grant Writing', 'Report Writing', 'Proofreading and Editing',
  'Referencing and Citation Management (Zotero/Mendeley)',
  // Design & Media
  'Graphic Design (Figma)', 'Graphic Design (Canva)', 'Graphic Design (Adobe Suite)',
  'Infographic Design', 'Poster Design', 'Medical Illustration', 'Video Editing',
  'Presentation Design (PowerPoint/Keynote)', 'Photography', 'Social Media Research',
  // Project & Admin
  'Questionnaire Development (REDCap/KoBoCollect)', 'Project Management', 'Research Coordination',
  'Ethical Approval Writing', 'Protocol Development', 'Health Communication', 'Science Communication',
  'Transcription (Audio/Video)', 'Translation', '3D Modelling', 'Animation',
]

export const COLLABORATOR_TYPES = [
  'Statistical Analyst', 'Data Scientist', 'Laboratory Technician', 'Field Researcher',
  'Bioinformatician', 'Molecular Biologist', 'Medical Illustrator', 'Graphic Designer',
  'Academic Writer', 'Scientific Editor', 'Literature Reviewer', 'Systematic Reviewer',
  'Survey Designer', 'Qualitative Researcher', 'Programmer (Python)', 'Programmer (R)',
  'Web Developer', 'Mobile Developer', 'GIS Specialist', 'Videographer / Video Editor',
  'Photographer', 'Project Coordinator', 'Grant Writer', 'Protocol Writer',
  'Presentation Designer', 'Translator', 'Social Media Researcher', 'Transcriptionist',
  'Machine Learning Engineer', 'AI Specialist', 'Database Manager', 'UX/UI Designer',
  'Health Communicator', 'Science Communicator', 'Mentor (Faculty)', 'Mentor (Postgraduate)',
  'Industry Expert', 'Technical Expert',
]

export const USER_ROLES = [
  {
    value: 'student_researcher',
    label: 'Student Researcher',
    description: 'I have a research idea — looking for collaborators and/or a mentor to develop it.',
  },
  {
    value: 'collaborator',
    label: 'Collaborator',
    description: 'I have skills to offer — looking for a research project to join and contribute to.',
  },
  {
    value: 'technical_expert',
    label: 'Technical Expert',
    description: 'I have specialist technical skills (statistics, bioinformatics, design, programming) — available for the task marketplace.',
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'I can offer mentorship — I am a faculty member, postgraduate student, or industry professional.',
  },
  {
    value: 'all',
    label: 'All of the above',
    description: 'I want to participate in all roles.',
  },
] as const

export type ExtendedUserRole = 'student_researcher' | 'collaborator' | 'technical_expert' | 'mentor' | 'all'

export const MENTOR_TIERS = [
  {
    tier: 1,
    title: 'Registered Faculty',
    subtitle: 'Lecturer I and above',
    requirements: ['Institutional staff email', 'Staff ID upload'],
  },
  {
    tier: 2,
    title: 'Postgraduate Student',
    subtitle: 'MSc or PhD student',
    requirements: ['Institutional email', 'Supervisor endorsement letter'],
  },
  {
    tier: 3,
    title: 'Industry Professional',
    subtitle: 'Professional outside academia',
    requirements: ['LinkedIn profile URL', 'Professional document upload', 'Manual review (takes 24-48 hrs)'],
  },
] as const

export type MentorTier = 1 | 2 | 3
