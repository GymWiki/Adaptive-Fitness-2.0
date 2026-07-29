-- Adds the fields the adaptive double-progression advice engine needs:
-- RIR per logged set, and a target rep-range/RIR-range/kind per exercise.

alter table public.workout_sets
  add column rir smallint not null default 2;

alter table public.exercises
  add column kind text not null default 'isolation' check (kind in ('compound', 'isolation')),
  add column rep_range_min smallint not null default 10,
  add column rep_range_max smallint not null default 15,
  add column target_rir_min smallint not null default 2,
  add column target_rir_max smallint not null default 3;

-- Classify the seeded exercise library. Compound lifts get a lower rep range
-- (6-10) and a bigger progression step; isolation work stays higher-rep
-- (10-15) with a smaller step (see wetenschappelijk-bronnenoverzicht.md).
update public.exercises
set kind = 'compound', rep_range_min = 6, rep_range_max = 10
where name in (
  'Bench press',
  'Squat',
  'Deadlift',
  'Overhead press',
  'Barbell row',
  'Pull-up'
) and user_id is null;
