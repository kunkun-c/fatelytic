-- Add Zi Wei chart payload + chart image to profiles

alter table public.profiles
  add column if not exists ziwei_chart_json jsonb,
  add column if not exists ziwei_chart_image_url text;
