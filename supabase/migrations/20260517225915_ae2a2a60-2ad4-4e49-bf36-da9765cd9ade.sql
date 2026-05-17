
ALTER TABLE public.crm_obras ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.crm_obras ALTER COLUMN status SET DEFAULT 'em_andamento'::public.crm_obra_status;

INSERT INTO storage.buckets (id, name, public)
VALUES ('crm-obras', 'crm-obras', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "crm-obras public read" ON storage.objects;
CREATE POLICY "crm-obras public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'crm-obras');

DROP POLICY IF EXISTS "crm-obras admin write" ON storage.objects;
CREATE POLICY "crm-obras admin write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-obras' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "crm-obras admin update" ON storage.objects;
CREATE POLICY "crm-obras admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-obras' AND public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "crm-obras admin delete" ON storage.objects;
CREATE POLICY "crm-obras admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-obras' AND public.has_role(auth.uid(), 'admin'::public.app_role));
