-- Rename legacy readings table to numerology_readings
alter table if exists public.readings rename to numerology_readings;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  lunar_date_of_birth date not null,
  time_of_birth text,
  place_of_birth text not null,
  gender text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_user_id_key on public.profiles(user_id);

-- Module-specific readings tables
create table if not exists public.eastern_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.western_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.iching_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.career_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.numerology_readings enable row level security;
alter table public.eastern_readings enable row level security;
alter table public.western_readings enable row level security;
alter table public.tarot_readings enable row level security;
alter table public.iching_readings enable row level security;
alter table public.career_readings enable row level security;

-- Profiles policies
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- Numerology policies
create policy "numerology_select_own" on public.numerology_readings
  for select using (auth.uid() = user_id);
create policy "numerology_insert_own" on public.numerology_readings
  for insert with check (auth.uid() = user_id);
create policy "numerology_delete_own" on public.numerology_readings
  for delete using (auth.uid() = user_id);

-- Generic policies for module tables
create policy "eastern_select_own" on public.eastern_readings
  for select using (auth.uid() = user_id);
create policy "eastern_insert_own" on public.eastern_readings
  for insert with check (auth.uid() = user_id);

create policy "western_select_own" on public.western_readings
  for select using (auth.uid() = user_id);
create policy "western_insert_own" on public.western_readings
  for insert with check (auth.uid() = user_id);

create policy "tarot_select_own" on public.tarot_readings
  for select using (auth.uid() = user_id);
create policy "tarot_insert_own" on public.tarot_readings
  for insert with check (auth.uid() = user_id);

create policy "iching_select_own" on public.iching_readings
  for select using (auth.uid() = user_id);
create policy "iching_insert_own" on public.iching_readings
  for insert with check (auth.uid() = user_id);

create policy "career_select_own" on public.career_readings
  for select using (auth.uid() = user_id);
create policy "career_insert_own" on public.career_readings
  for insert with check (auth.uid() = user_id);
