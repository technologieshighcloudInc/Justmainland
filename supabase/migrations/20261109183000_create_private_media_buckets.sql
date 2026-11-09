INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES
  ('property-images', 'property-images', false, 6291456),
  ('site-media', 'site-media', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;