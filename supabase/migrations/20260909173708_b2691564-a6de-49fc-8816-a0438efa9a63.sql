CREATE TABLE IF NOT EXISTS public.inspection_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  preferred_date date NOT NULL,
  preferred_time text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.inspection_bookings TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inspection_bookings TO authenticated;
GRANT ALL ON public.inspection_bookings TO service_role;

ALTER TABLE public.inspection_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can request an inspection"
  ON public.inspection_bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 2 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(coalesce(phone, '')) <= 40
    AND length(coalesce(notes, '')) <= 1000
    AND length(coalesce(preferred_time, '')) <= 40
    AND status = 'requested'
  );

CREATE POLICY "Admins can read inspections"
  ON public.inspection_bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inspections"
  ON public.inspection_bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inspections"
  ON public.inspection_bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER inspection_bookings_set_updated_at
  BEFORE UPDATE ON public.inspection_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.validate_inspection_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.preferred_date < (now() AT TIME ZONE 'Africa/Lagos')::date THEN
    RAISE EXCEPTION 'Inspection date cannot be in the past';
  END IF;
  IF NEW.preferred_date > ((now() AT TIME ZONE 'Africa/Lagos')::date + INTERVAL '90 days') THEN
    RAISE EXCEPTION 'Inspection date is too far ahead';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_inspection_date() FROM PUBLIC, anon;

CREATE TRIGGER inspection_bookings_validate_date
  BEFORE INSERT ON public.inspection_bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_inspection_date();

CREATE INDEX IF NOT EXISTS inspection_bookings_created_at_idx
  ON public.inspection_bookings (created_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_allowlist (
  email text PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_allowlist TO service_role;

ALTER TABLE public.admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to admin allowlist"
  ON public.admin_allowlist FOR SELECT TO authenticated
  USING (false);

INSERT INTO public.admin_allowlist (email, note)
VALUES ('technologies.highcloud@gmail.com', 'Super administrator')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.site_settings (key, value, label) VALUES
  ('whatsapp_number', '2348000000000', 'WhatsApp number (digits only, with country code)'),
  ('support_email', 'support@realestatejagaban.com', 'Support email address'),
  ('brand_handle', 'RealEstateJagaban', 'Brand handle')
ON CONFLICT (key) DO NOTHING;