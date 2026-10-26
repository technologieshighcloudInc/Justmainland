-- =========================================================
-- ROLES
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SHARED updated_at TRIGGER FN
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- PROPERTIES
-- =========================================================
CREATE TYPE public.property_status AS ENUM ('draft', 'published', 'sold', 'rented');
CREATE TYPE public.property_kind   AS ENUM ('sale', 'rent', 'shortlet');
CREATE TYPE public.property_type   AS ENUM ('house', 'apartment', 'land', 'commercial', 'duplex', 'office');

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  price numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'NGN',
  price_period text,
  property_type public.property_type NOT NULL DEFAULT 'house',
  listing_kind public.property_kind NOT NULL DEFAULT 'sale',
  city text NOT NULL DEFAULT 'Lagos',
  area text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  bedrooms integer NOT NULL DEFAULT 0,
  bathrooms integer NOT NULL DEFAULT 0,
  size_sqm numeric(10,2),
  features text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  status public.property_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX properties_status_idx ON public.properties(status);
CREATE INDEX properties_featured_idx ON public.properties(is_featured);
CREATE INDEX properties_kind_idx ON public.properties(listing_kind);

GRANT SELECT ON public.properties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view listed properties"
  ON public.properties FOR SELECT TO anon, authenticated
  USING (status IN ('published', 'sold', 'rented'));

CREATE POLICY "Admins can view every property"
  ON public.properties FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create properties"
  ON public.properties FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update properties"
  ON public.properties FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete properties"
  ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER properties_set_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PROPERTY IMAGES
-- =========================================================
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX property_images_property_idx ON public.property_images(property_id);

GRANT SELECT ON public.property_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view images of listed properties"
  ON public.property_images FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = property_id AND p.status IN ('published', 'sold', 'rented')
  ));

CREATE POLICY "Admins can view all property images"
  ON public.property_images FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage property images"
  ON public.property_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- ENQUIRIES
-- =========================================================
CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enquiries_created_idx ON public.enquiries(created_at DESC);

GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send an enquiry"
  ON public.enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(message) BETWEEN 1 AND 2000
    AND length(coalesce(phone, '')) <= 40
    AND length(coalesce(subject, '')) <= 200
  );

CREATE POLICY "Admins can read enquiries"
  ON public.enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update enquiries"
  ON public.enquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete enquiries"
  ON public.enquiries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SITE SETTINGS
-- =========================================================
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  label text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- STORAGE POLICIES (bucket: property-images)
-- =========================================================
CREATE POLICY "Site can read property images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');

CREATE POLICY "Admins can upload property images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update property images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete property images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- SEED: SITE SETTINGS
-- =========================================================
INSERT INTO public.site_settings (key, value, label) VALUES
  ('hero_eyebrow',    'Exclusive Lagos Portfolio',                         'Hero eyebrow text'),
  ('hero_title',      'Architectural dominance in Eko Atlantic.',          'Hero headline'),
  ('hero_subtitle',   'Precision-engineered living spaces for Nigeria''s next generation of owners. Futuristic design meets generational asset security.', 'Hero subtitle'),
  ('stat_1_value',    '₦14.2B+',             'Stat 1 value'),
  ('stat_1_label',    'Assets Managed',      'Stat 1 label'),
  ('stat_2_value',    '850+',                'Stat 2 value'),
  ('stat_2_label',    'Prime Hectares',      'Stat 2 label'),
  ('stat_3_value',    '18%',                 'Stat 3 value'),
  ('stat_3_label',    'Average Annual Yield','Stat 3 label'),
  ('stat_4_value',    '24/7',                'Stat 4 value'),
  ('stat_4_label',    'Client Concierge',    'Stat 4 label'),
  ('about_heading',   'Redefining the EstateJagaban standard.', 'About heading'),
  ('about_body',      'EA Properties Solution is a licensed Nigerian real estate firm operating across Lagos and Abuja. We combine data-led site selection with architectural excellence to build portfolios that outlast market cycles.', 'About body copy'),
  ('contact_phone',   '+234 801 234 5678',   'Phone number'),
  ('contact_email',   'hello@eaproperties.ng','Email address'),
  ('contact_whatsapp','2348012345678',       'WhatsApp number (digits only)'),
  ('office_lagos',    'Floor 18, REA Tower, Eko Atlantic, Victoria Island, Lagos', 'Lagos office'),
  ('office_abuja',    '7 Gana Street, Maitama, Abuja',  'Abuja office'),
  ('instagram_url',   'https://instagram.com/realestatejagaban', 'Instagram URL'),
  ('linkedin_url',    'https://linkedin.com', 'LinkedIn URL');

-- =========================================================
-- SEED: DEMO PROPERTIES
-- =========================================================
INSERT INTO public.properties
  (slug, title, summary, description, price, currency, price_period, property_type, listing_kind, city, area, address, bedrooms, bathrooms, size_sqm, features, status, is_featured)
VALUES
  ('obsidian-spire-ikoyi', 'The Obsidian Spire', 'A 5-bedroom sky residence with panoramic lagoon views.',
   'Rising above the Ikoyi skyline, The Obsidian Spire is a limited collection of full-floor sky residences. Each unit is delivered with a private lift lobby, smart-home automation, and floor-to-ceiling glazing framing uninterrupted lagoon views. Residents enjoy a 24-hour independent power grid, biometric access control, and a rooftop infinity deck.',
   1200000000, 'NGN', NULL, 'apartment', 'sale', 'Lagos', 'Ikoyi', 'Bourdillon Road, Ikoyi, Lagos', 5, 6, 620.00,
   ARRAY['Private lift lobby','24-hour power grid','Biometric security','Rooftop infinity pool','Smart home automation','Concierge service'],
   'published', true),

  ('azure-heights-banana-island', 'Azure Heights', 'Waterfront 4-bedroom terraces on Banana Island.',
   'Azure Heights delivers eight waterfront terraces on Banana Island, each with a private jetty access point and landscaped courtyard. Interiors are finished in warm oak and honed stone, with a dedicated staff wing and a double-height living volume opening onto the water.',
   870000000, 'NGN', NULL, 'house', 'sale', 'Lagos', 'Banana Island', 'Ocean Parade, Banana Island, Lagos', 4, 5, 480.00,
   ARRAY['Waterfront frontage','Private jetty access','Staff quarters','Landscaped courtyard','Fitted kitchen','Gated estate'],
   'published', true),

  ('titan-commercial-plaza-lekki', 'Titan Commercial Plaza', 'Grade-A office floors on Admiralty Way.',
   'Titan Commercial Plaza offers flexible Grade-A office floors on Admiralty Way, Lekki Phase 1. Each floor is delivered shell-and-core or fully fitted, with dedicated fibre risers, a 100% power backup ring, and secure basement parking for forty vehicles.',
   4500000, 'NGN', 'month', 'office', 'rent', 'Lagos', 'Lekki Phase 1', 'Admiralty Way, Lekki Phase 1, Lagos', 0, 4, 350.00,
   ARRAY['Grade-A specification','Fibre-ready risers','100% power backup','Basement parking','Passenger lifts','24-hour security'],
   'published', true),

  ('maitama-ridge-villa', 'Maitama Ridge Villa', 'Modernist 6-bedroom villa with pool in Maitama.',
   'A sculptural modernist villa set on 1,400 sqm in the heart of Maitama. Sharp cantilevered volumes wrap a central courtyard and heated pool, with a cinema room, wine cellar, and self-contained guest chalet at the rear of the compound.',
   1650000000, 'NGN', NULL, 'duplex', 'sale', 'Abuja', 'Maitama', 'Gana Street, Maitama, Abuja', 6, 7, 1400.00,
   ARRAY['Heated swimming pool','Cinema room','Wine cellar','Guest chalet','Solar inverter system','Double garage'],
   'published', true),

  ('epe-growth-corridor-land', 'Epe Growth Corridor Land', 'Serviced plots along the Lekki-Epe expressway.',
   'Serviced residential plots positioned directly along the Lekki-Epe expansion corridor, minutes from the Lekki Free Trade Zone. Fully documented with a registered survey and governor''s consent in progress. Ideal entry-level land banking for medium-term appreciation.',
   28000000, 'NGN', NULL, 'land', 'sale', 'Lagos', 'Epe', 'Lekki-Epe Expressway, Epe, Lagos', 0, 0, 600.00,
   ARRAY['Registered survey','Deed of assignment','Graded access roads','Perimeter fencing','Instalment plan available'],
   'published', false),

  ('the-monolith-victoria-island', 'The Monolith', 'Serviced 3-bedroom apartments for short and long lets.',
   'The Monolith brings hotel-grade serviced living to Victoria Island. Each three-bedroom apartment is delivered fully furnished with housekeeping, a residents gym, co-working lounge, and uninterrupted power — available on flexible six-month and twelve-month leases.',
   9500000, 'NGN', 'year', 'apartment', 'rent', 'Lagos', 'Victoria Island', 'Adeola Odeku Street, Victoria Island, Lagos', 3, 3, 210.00,
   ARRAY['Fully furnished','Housekeeping included','Residents gym','Co-working lounge','Uninterrupted power','Secure parking'],
   'published', false);
