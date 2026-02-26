-- Ensure deleting an auth user cascades to legacy numerology_readings (renamed from readings)

-- Drop possible existing FK constraint names (depending on when rename happened)
alter table if exists public.numerology_readings
  drop constraint if exists numerology_readings_user_id_fkey;

alter table if exists public.numerology_readings
  drop constraint if exists readings_user_id_fkey;

-- Recreate FK with ON DELETE CASCADE
alter table if exists public.numerology_readings
  add constraint numerology_readings_user_id_fkey
  foreign key (user_id)
  references auth.users (id)
  on delete cascade;
