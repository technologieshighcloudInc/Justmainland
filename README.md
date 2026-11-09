# Hello World Project

Hello.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://realestatejagaban.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5a694840-1e6b-49c2-af44-328db3abdc91).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Production deployment

Apply the Supabase migrations to the production project with `supabase db push`. This provisions the database schema and the private `property-images` and `site-media` storage buckets used by the admin image tools.

Configure these variables in the deployment environment:

- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for server-side Supabase access.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` with the same project URL and publishable key for browser sign-in.
- `SUPABASE_SERVICE_ROLE_KEY` for authenticated admin uploads and private media delivery. Keep this server-only; never use a `VITE_` prefix.
- `CAPTCHA_SECRET` as a private random secret for production sign-in and form CAPTCHA signing.

Enable email/password sign-in in Supabase Auth and set the production site URL and allowed redirect URLs to the deployed domain. Before signing in as the initial administrator, make sure that account's exact email is in `public.admin_allowlist`; the initial seed address is defined in the Supabase migrations. For a different admin email, add it in the Supabase SQL editor:

```sql
INSERT INTO public.admin_allowlist (email, note)
VALUES ('your-admin@example.com', 'Initial administrator')
ON CONFLICT (email) DO NOTHING;
```
