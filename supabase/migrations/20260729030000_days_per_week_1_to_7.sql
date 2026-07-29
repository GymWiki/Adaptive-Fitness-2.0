-- The template library now covers 1-7 days/week (previously 2-6).
alter table public.profiles
  drop constraint profiles_days_per_week_check,
  add constraint profiles_days_per_week_check check (days_per_week between 1 and 7);
