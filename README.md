# AGRIVA

AI-powered agriculture Super App for web.

## Vision

AGRIVA combines agriculture tools, AI assistance, smart search, marketplace, farm intelligence, content, and an admin intelligence center in one modern web platform.

## Initial Stack

- Next.js
- TypeScript
- Tailwind CSS
- Supabase / PostgreSQL
- OpenAI API
- GitHub integration
- Vercel

## Initial Modules

- AI Assistant
- Smart Search
- Search Intelligence
- User Dashboard
- Admin AI Command Center
- Articles
- Marketplace
- Farms & Crops
- GitHub Developer Hub

## Development

Environment variables belong in `.env.local` and must never be committed.

See `.env.example` for the required configuration shape.


## First production admin setup

1. In the Supabase project, apply the repository migrations in order, including `028_admin_bootstrap_product_creation.sql`.
2. In Vercel, set `AGRIVA_OWNER_EMAIL` to the owner's exact sign-in email and set `SUPABASE_SERVICE_ROLE_KEY` as a **server-only** environment variable. Never prefix the service key with `NEXT_PUBLIC_` and never commit its value.
3. Deploy the branch to a preview, create the owner account at `/signup`, and complete email verification if enabled.
4. Sign in with that owner account and visit `/admin/setup`. The bootstrap succeeds only if the email matches the configured owner and no admin already exists.
5. Open `/admin/products` to create actual catalogue items and `/admin/categories` to manage categories. Do not seed invented products into the live catalogue.
6. Keep `online_payment_enabled=false` until SSLCommerz production credentials, amount/currency checks, callback URLs, and a real low-value test transaction have been verified.

The current database can be empty even when the schema is healthy. Signup creates a profile; the first product and order data must come from real users/admin entry or a reviewed import.
