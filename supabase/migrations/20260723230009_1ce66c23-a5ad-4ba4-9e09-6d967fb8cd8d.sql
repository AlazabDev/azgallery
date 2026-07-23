
CREATE POLICY "temp_cloudinary_import" ON public.project_images FOR INSERT TO anon
  WITH CHECK (project_id = 'c10ad000-0000-0000-0000-000000000001');
