-- Fix RLS for eastern_uploads storage bucket
-- Allow authenticated users to upload files to their own folder only

-- Enable RLS on the bucket (if not already enabled)
-- Note: Storage buckets use different RLS syntax

-- Policy: Users can upload files to their own folder (user_id/*)
create policy "Users can upload to their own folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'eastern_uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own files
create policy "Users can read own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'eastern_uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files
create policy "Users can update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'eastern_uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'eastern_uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files
create policy "Users can delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'eastern_uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);
