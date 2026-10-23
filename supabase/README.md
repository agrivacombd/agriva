# AGRIVA Supabase production setup

## Migration history and safe deployment

The filenames in `supabase/migrations/` use the exact version prefixes recorded in the confirmed production project's `supabase_migrations.schema_migrations` history. The original numbered migrations `001`–`028` have been renamed to their recorded production versions; this is a filename-only reconciliation, not a request to rerun them.

**Do not run a blanket `supabase db push` until the local/remote migration list has been checked with `supabase migration list`.** Always verify that local and remote versions match first. Production schema changes should be applied as reviewed migrations and their resulting version should be reflected in the repository.

Files in `supabase/legacy_unapplied_migrations/` are intentionally excluded from the active migration directory because they are not present in the confirmed production migration history. They are preserved for review, not approved for automatic execution:
- `029_product_seo_schema.sql` includes additional admin RPC overloads and must be reviewed against live RPCs before any adoption.
- `030_seed_seo_and_reporting.sql` adds optional seed-specific product attributes and an admin RPC; apply only after product-schema and UI review.
- `031_google_site_integrations.sql` and `032_more_site_verification_providers.sql` add optional site verification / tracking settings; verify the live `site_public_integrations` schema and consumers first.

The following later migrations have been applied and verified in production:
- `20261023142537_product_seo_fields_compat`
- `20261023142603_product_form_feature_controls`
- `20261023142950_feature_control_policy_performance_and_is_admin_grants`
- `20261023143034_product_form_feature_foreign_key_indexes`
- `20261023143117_feature_control_jwt_rls_initplan_fix`
- `20261023144623_index_existing_foreign_keys`
- `20261023144817_split_public_and_authenticated_read_policies`
- `20261023144859_remove_overlapping_products_read_policy`
- `20261023145924_rls_auth_uid_initplan_optimization`

Do **not** run `database/schema.sql` on top of these migrations; that legacy schema contains overlapping `profiles`, `products`, and search tables.

## Core platform migrations

- `001`–`007`: core farmer/reseller marketplace and search intelligence
- `008`–`010`: AI drafts, platform hardening, and payment integrity
- `011`–`012`: persistent cart compatibility
- `013`: commission ledger compatibility
- `014`: production reseller attribution, marketplace orders, and atomic COD stock/commission flow
- `015`: commission approval on delivery/completion and reversal on cancellation/refund
- `016`: controlled reseller payout settlement
- `017`: crop disease detection history and related policies
- `018`: policy syntax repair for PostgreSQL compatibility
- `019`: farmer-owned crop cycles and sowing/harvest planning
- `020`: farmer-owned expense and harvest-sales ledgers
- `021`–`028`: public referral resolution, attribution validation, admin read policies, admin product/user management, site settings, and product-category management

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

If `GEMINI_API_KEY` is configured, the admin SEO draft endpoint can generate structured article drafts. Without it, the endpoint uses a safe structured fallback. Generated content remains a draft until an admin reviews and publishes it.

## Crop disease photo analysis

Migration `017_crop_disease_detections` is already part of the recorded production migration history; do not re-run it. It creates the private `crop-disease-photos` Storage bucket, a per-user diagnosis history table, and row-level security policies. Users must be signed in; photos are limited to JPG, PNG, or WebP up to 5 MB.

Set `GEMINI_API_KEY` and a model available to your Google AI Studio / Gemini API project in `GEMINI_MODEL`. The server sends the uploaded image to Gemini for a cautious Bengali-language triage result; it does not claim a verified diagnosis. Never put the Gemini key in a `NEXT_PUBLIC_*` variable. The API reports a configuration error rather than pretending to analyze photos when the key is missing.
