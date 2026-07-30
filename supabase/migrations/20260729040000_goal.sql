-- Training goal, chosen during onboarding alongside days/equipment/experience.
-- Feeds the goal-parameter overlay in generateProgram() — see
-- docs/superpowers/specs/2026-07-29-onboarding-goal-parameters-design.md.

alter table public.profiles
  add column goal text check (goal in ('hypertrophy', 'strength', 'fat_loss', 'conditioning', 'mix'));
