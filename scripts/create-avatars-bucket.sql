-- Create avatars bucket in Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up public access policy for avatars bucket
CREATE POLICY "Public access to avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Allow users to upload their own avatars" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Allow users to update their own avatars" ON storage.objects
  FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
  );
