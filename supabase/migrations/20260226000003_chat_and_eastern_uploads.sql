-- Chat persistence for Q&A

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module text not null,
  reading_id uuid null references public.eastern_readings (id) on delete set null,
  context_json jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_id_idx on public.chat_sessions (user_id);
create index if not exists chat_sessions_reading_id_idx on public.chat_sessions (reading_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_idx on public.chat_messages (session_id);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Users can manage their own sessions
create policy "chat_sessions_select_own"
on public.chat_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "chat_sessions_insert_own"
on public.chat_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "chat_sessions_update_own"
on public.chat_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_sessions_delete_own"
on public.chat_sessions
for delete
to authenticated
using (auth.uid() = user_id);

-- Users can manage messages only for their own sessions
create policy "chat_messages_select_own"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_sessions s
    where s.id = chat_messages.session_id
      and s.user_id = auth.uid()
  )
);

create policy "chat_messages_insert_own"
on public.chat_messages
for insert
to authenticated
with check (
  exists (
    select 1
    from public.chat_sessions s
    where s.id = chat_messages.session_id
      and s.user_id = auth.uid()
  )
);

create policy "chat_messages_update_own"
on public.chat_messages
for update
to authenticated
using (
  exists (
    select 1
    from public.chat_sessions s
    where s.id = chat_messages.session_id
      and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.chat_sessions s
    where s.id = chat_messages.session_id
      and s.user_id = auth.uid()
  )
);

create policy "chat_messages_delete_own"
on public.chat_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.chat_sessions s
    where s.id = chat_messages.session_id
      and s.user_id = auth.uid()
  )
);

-- Storage bucket for Eastern astrology chart uploads
insert into storage.buckets (id, name, public)
values ('eastern_uploads', 'eastern_uploads', true)
on conflict (id) do nothing;
