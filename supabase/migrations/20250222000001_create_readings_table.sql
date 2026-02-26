create table readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  full_name text not null,
  date_of_birth date not null,
  gender text,
  life_path_number int not null,
  expression_number int not null,
  soul_urge_number int not null,
  result_json jsonb not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table readings enable row level security;

-- RLS policies
create policy "Users can insert own readings" 
  on readings for insert 
  with check (auth.uid() = user_id);

create policy "Users can view own readings" 
  on readings for select 
  using (auth.uid() = user_id);

create policy "Users can delete own readings" 
  on readings for delete 
  using (auth.uid() = user_id);

-- Create index for faster queries
create index idx_readings_user_id on readings(user_id);
create index idx_readings_created_at on readings(created_at desc);
