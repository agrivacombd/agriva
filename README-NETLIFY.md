# AGRIVA on Netlify

AGRIVA is a Next.js App Router application and is configured for Netlify deployment.

## Deploy from GitHub

1. In Netlify, choose **Add new project → Import an existing project**.
2. Connect GitHub and select `agrivacombd/agriva`.
3. Use the `main` branch for production.
4. Netlify will read `netlify.toml` and run `npm run build` with Node 20.
5. Add the required environment variables in Netlify Site configuration before deploying.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_SITE_URL`
- `PAYMENT_WEBHOOK_SECRET` (only when online payments are enabled)

Payment can remain disabled while Cash on Delivery is used.

Do not put Supabase service-role keys or payment secrets in this repository.
