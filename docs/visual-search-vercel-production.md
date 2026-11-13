# AGRIVA Visual Search — Vercel production release checklist

Scope: AGRIVA unified product-first search, visual image-index API and optional
on-device CLIP embedding model. Netlify is **not** a deployment target for this
release.

## 1. Preflight (Vercel project agriva-p8g6)

- Confirm the intended GitHub **main** commit passed GitHub Actions: lint,
  TypeScript, visual-search privacy tests, semantic image-rank tests, and build.
- Confirm the Vercel Production environment has
  NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or supported
  publishable key), linked to the expected live Supabase project.
- Only anonymous/publishable keys may be used for publicly listed products.
  Never use the service-role or secret key for public image search.
- Confirm Supabase RLS still only exposes active public marketplace listings.
- The new image-index route returns only products with public Supabase image
  paths, with a verified storageOrigin. The on-device worker refuses any
  other image origins.
- Confirm Vercel build quota has reset; avoid repeated no-op deployments.

## 2. Deployment gate

- Deploy a fresh, tested **main** SHA through the existing Vercel Git
  integration, targeting **production**. Do not promote arbitrary preview
  commits or an outdated SHA.
- Wait for state READY and verify agriva.com.bd (and www) resolves to the
  expected deployment. Check the actual deployed SHA, not only CI status.

## 3. Read-only HTTP smoke test

Run against the new production deployment:

    AGRIVA_BASE_URL=https://agriva.com.bd EXPECT_VISUAL_PRODUCTS=1 npm run test:visual-search-production

The command checks:

- Text GET product search works with no AI response or paid model call.
- GET /api/search/visual-index responds with HTTP 200 and product data.
- Active marketplace photos have a public Supabase storage origin, matching
  the returned storageOrigin, and every fingerprint has 768 valid channels.
- Production has at least one indexed photo (expected while products exist).

If the endpoint returns HTTP 503, check runtime logs, the public Supabase
configuration and anon/RLS policies before calling the release successful.

## 4. Manual real-browser checks

1. Desktop and Android: search for a known active product by text, then
   open its slug link and verify current price and stock.
2. Upload a known catalogue product image using the camera/gallery icon.
   It should match itself or rank highly.
3. Upload a different, real-world crop or seed-packet photo. Check that
   ranking is sensible; visual similarity is NOT proof of product identity.
4. Opt in to the heavier CLIP mode. Test a clean browser once and a repeat
   search using IndexedDB cache. Verify cancel, progress, failure fallback.
5. Test slow/mobile connection, denied permissions and corrupt/oversize files.
6. Verify the user's uploaded photo is not sent to any AGRIVA API.
7. Check that a paid OpenAI/Gemini request is never sent for text search,
   camera search or optional on-device semantic ranking.

## 5. Monitoring and rollback

- Review Vercel runtime logs for image-index 503/500, timeout, and storage
  failures. Large photo libraries may require a persisted server-side index
  rather than on-demand signatures.
- Watch Supabase outbound traffic and cache hit rate after release.
- If image search fails, preserve the working text search and roll back to the
  last known READY Vercel production deployment. Do not loosen RLS or paste
  privileged database credentials into configuration.
- Document any unverified browser-model runtime or matching-quality checks
  before marking the entire release as verified.

Reference paths:
- app/api/search/visual-index/route.ts
- app/search/page.tsx
- components/search/VisualSearchButton.tsx
- public/workers/agriva-semantic-vision.mjs
- scripts/smoke-visual-search-production.mjs
