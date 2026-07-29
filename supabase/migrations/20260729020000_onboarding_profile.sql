-- Profile fields collected during onboarding, feeding generateProgram()
-- (days_per_week, equipment, experience_level) plus lightweight basics.

alter table public.profiles
  add column weight_kg numeric(5, 2),
  add column height_cm numeric(5, 1),
  add column gender text check (gender in ('male', 'female', 'other')),
  add column birth_year smallint,
  add column days_per_week smallint check (days_per_week between 2 and 6),
  add column equipment text check (equipment in ('full_gym', 'home_dumbbells', 'bodyweight_only')),
  add column experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  add column onboarding_completed boolean not null default false;
