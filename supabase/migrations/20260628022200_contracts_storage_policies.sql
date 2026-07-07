-- Setup storage policies for contracts bucket
DROP POLICY IF EXISTS "Allow public read access to contracts bucket" ON storage.objects;
CREATE POLICY "Allow public read access to contracts bucket" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'contracts');

DROP POLICY IF EXISTS "Allow admins to upload to contracts bucket" ON storage.objects;
CREATE POLICY "Allow admins to upload to contracts bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Allow admins to delete from contracts bucket" ON storage.objects;
CREATE POLICY "Allow admins to delete from contracts bucket" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'contracts' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );