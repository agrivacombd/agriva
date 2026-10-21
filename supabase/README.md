# AGRIVA Supabase production setup

## Recommended migration path

Use the migrations in `supabase/migrations/` in numeric order, `001` through `017`, in the production Supabase SQL Editor or via Supabase CLI.

Do **not** run `database/schema.sql` on top of these migrations; that legacy schema contains overlapping `profiles`, `products`, and search tables.

The important launch migrations are:

- `001`–`007`: core farmer/reseller marketplace + search intelligence
- `008`–`010`: AI drafts, platform hardening and payment integrity
- `011`–`012`: persistent cart compatibility
- `013`: commission ledger compatibility
- `014`: production reseller attribution, marketplace orders, atomic COD stock/commission flow
- `015`: commission approval on delivery/completion and reversal on cancellation/refund
- `016`: controlled reseller payout settlement

## Vercel environment variables

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Keep these server-only secrets out of GitHub:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- payment provider secrets

## Current launch payment mode

AGRIVA supports **Cash on Delivery** without an online payment provider. Online payment can be enabled later.

## AI content

If `GEMINI_API_KEY` is configured, the admin SEO draft endpoint can generate structured article drafts. Without it, the endpoint uses a safe structured fallback. All generated content remains a draft until an admin reviews and publishes it.


## Crop disease photo analysis

Apply `supabase/migrations/017_crop_disease_detections.sql` after the existing migrations. It creates the private `crop-disease-photos` Storage bucket, a per-user diagnosis history table, and row-level security policies for both. Users must be signed in; photos are limited to JPG, PNG, or WebP up to 5 MB.

Set `GEMINI_API_KEY` and a model available to your Google AI Studio / Gemini API project in `GEMINI_MODEL`. The server sends the uploaded image to Gemini for a cautious Bengali-language triage result; it does not claim a verified diagnosis. Never put the Gemini key in a `NEXT_PUBLIC_*` variable. The API reports a configuration error rather than pretending to analyze photos when the key is missing.
