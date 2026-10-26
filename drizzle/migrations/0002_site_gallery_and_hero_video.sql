CREATE TABLE public.site_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('home','services')),
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_gallery TO anon, authenticated;
GRANT ALL ON public.site_gallery TO service_role;
ALTER TABLE public.site_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sees active gallery images" ON public.site_gallery FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Admins manage gallery" ON public.site_gallery FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_gallery (section, title, image_url, sort_order) VALUES
  ('home', 'Completed property from JustMainlandNG', '/__l5e/assets-v1/292beb6f-4b29-47c3-bdb5-dbb23d5bfeb7/mainland-photo-2.jpg', 0),
  ('home', 'Property development from JustMainlandNG', '/__l5e/assets-v1/cdbb3547-922c-4f35-9ade-ea558b669cdd/mainland-photo-3.jpg', 1),
  ('home', 'Maryland apartment promotion', '/__l5e/assets-v1/35c037ae-b01b-4f46-8dea-494649dc8ba8/mainland-photo-4.jpg', 2),
  ('home', 'JustMainlandNG property investment promotion', '/__l5e/assets-v1/1e1e2f2e-959f-465c-a18f-fa4800a92d00/mainland-photo-5.jpg', 3),
  ('services', 'Aerial view of Lagos and its neighbourhoods', '/__l5e/assets-v1/e09954cc-cc1b-4023-97b1-752d755202d1/mainland-photo-7.jpg', 0),
  ('services', 'Allen Avenue intersection in Ikeja, Lagos', '/__l5e/assets-v1/47191fe4-f2f3-4d2c-a08b-21b8d171f070/mainland-photo-1.jpg', 1),
  ('services', 'Completed property from JustMainlandNG', '/__l5e/assets-v1/292beb6f-4b29-47c3-bdb5-dbb23d5bfeb7/mainland-photo-2.jpg', 2);

INSERT INTO public.site_settings (key, value, label)
SELECT 'hero_video_url', '', 'Homepage background video (managed under Media)'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'hero_video_url');
