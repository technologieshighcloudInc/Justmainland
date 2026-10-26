# EA Properties Solution — Modern Real Estate Site + Admin Backend

A futuristic, professional real estate website for **EA Properties Solution** (REA EstateJagaban), backed by a real database and a private admin area where you manage listings yourself — no code edits needed.

## Design foundation

Locked from your choices:

- **Palette (Navy Trust):** `#0f1b3d` deep navy, `#1e3a5f` mid navy, `#3b6fa0` steel blue, `#e8edf3` crisp white
- **Type:** Sora for headings, Manrope for body
- **Homepage:** split-screen hero (headline + CTAs left, architectural imagery right)
- **Feel:** glassmorphic cards, hairline grid overlays, slow gradient-mesh drift, restrained hover lift. No purple gradients, no stock people photos.

## Public site

Separate routes so each page is shareable and search-indexable:

- `/` — split-screen hero, stats band, featured listings, services strip, contact CTA
- `/properties` — all listings with filters (type, location, price range, status)
- `/properties/$slug` — single listing: image gallery, price, specs, features, agent contact / enquiry form
- `/services` — Buy, Sell, Rent, Invest / Advisory
- `/about` — company story, offices, credibility
- `/contact` — enquiry form + office details + WhatsApp link

Shared navy header and footer across all pages. Fully responsive (mobile-first).

## Admin backend

Private area at `/admin`, reachable only after login.

- **Login** at `/auth` — email + password for staff accounts
- **Dashboard** — counts of live / draft / sold listings, recent enquiries
- **Listings manager** — create, edit, publish/unpublish, mark as sold, delete. Fields: title, slug, description, price, currency, type (house/land/apartment/commercial), listing kind (sale/rent), location, bedrooms, bathrooms, size, features list, status, featured flag
- **Image uploads** — drag-and-drop multiple photos per listing, set the cover image, reorder
- **Enquiries inbox** — every contact/enquiry form submission, marked read/unread
- **Site content** — edit hero headline, stats numbers, and about copy without touching code

Only signed-in admins can write. The public site reads published listings only.

## What powers it

Lovable Cloud is enabled for this project, giving you:

- A database for listings, listing images, enquiries, site settings, and admin roles
- Staff login and session handling
- File storage for property photos
- Server-side logic for the enquiry form

## Technical notes

- Tables: `properties`, `property_images`, `enquiries`, `site_settings`, `user_roles`
- Roles live in a dedicated `user_roles` table with a security-definer `has_role()` check — never on a profile row — so admin status cannot be faked from the browser
- Row-level security: public gets read-only access to `status = 'published'` properties and their images; all writes require an admin role; enquiries are insert-only for the public and readable only by admins
- Public pages read through a server-side publishable client so listings render server-side for SEO; admin pages sit under an authenticated route group
- Enquiry form validated with Zod on both client and server, with length limits
- Per-route `head()` metadata: unique title, description, og/twitter tags; listing pages use the property cover photo as the social preview image
- Hero and section imagery generated to match the navy architectural direction and stored in `src/assets`
- Design tokens defined in `src/styles.css`; fonts loaded via `<link>` in the root route

## Build order

1. Design system tokens, fonts, header/footer shell
2. Homepage with generated imagery
3. Cloud setup: tables, policies, storage bucket, admin role
4. Properties listing + detail pages reading live data
5. Admin login, listings CRUD, image uploads
6. Enquiries inbox, site settings editor
7. Services / About / Contact pages, SEO pass, mobile polish

## Open item

I generated three visual directions before this message (Penthouse command center, Command Center bento, Architectural precision). Once you approve this plan I'll resurface them so you can pick the exact look before I start building.
