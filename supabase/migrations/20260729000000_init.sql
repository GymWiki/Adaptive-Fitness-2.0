-- Profiles: one row per auth user
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Profiles are editable by owner"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create a profile row automatically when a new auth user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Exercises: a shared library (user_id null) plus user-added exercises
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  muscle_group text,
  created_at timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Exercises are viewable by everyone"
  on public.exercises for select
  using (user_id is null or auth.uid() = user_id);

create policy "Users can add their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Workouts: one training session per user
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text,
  performed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

create policy "Users can view their own workouts"
  on public.workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on public.workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workouts"
  on public.workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workouts"
  on public.workouts for delete
  using (auth.uid() = user_id);

-- Workout sets: individual sets within a workout
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  set_order integer not null default 1,
  weight_kg numeric(6, 2) not null,
  reps integer not null,
  created_at timestamptz not null default now()
);

alter table public.workout_sets enable row level security;

create policy "Users can view sets of their own workouts"
  on public.workout_sets for select
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can insert sets into their own workouts"
  on public.workout_sets for insert
  with check (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can update sets of their own workouts"
  on public.workout_sets for update
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create policy "Users can delete sets of their own workouts"
  on public.workout_sets for delete
  using (
    exists (
      select 1 from public.workouts
      where workouts.id = workout_sets.workout_id
      and workouts.user_id = auth.uid()
    )
  );

create index workout_sets_workout_id_idx on public.workout_sets (workout_id);
create index workouts_user_id_idx on public.workouts (user_id);

-- Seed a base library of common exercises (shared, user_id is null)
insert into public.exercises (name, muscle_group) values
  ('Bench press', 'Borst'),
  ('Incline dumbbell press', 'Borst'),
  ('Squat', 'Benen'),
  ('Deadlift', 'Rug/Benen'),
  ('Overhead press', 'Schouders'),
  ('Barbell row', 'Rug'),
  ('Pull-up', 'Rug'),
  ('Lat pulldown', 'Rug'),
  ('Bicep curl', 'Armen'),
  ('Tricep pushdown', 'Armen'),
  ('Leg press', 'Benen'),
  ('Leg curl', 'Benen'),
  ('Calf raise', 'Benen'),
  ('Plank', 'Core');
