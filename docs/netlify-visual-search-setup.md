# Netlify Deploy Preview: AGRIVA Visual Search configuration

This applies to Netlify's agrivaai preview site. GitHub Deploy Previews do not inherit environment variables from Vercel, even if both deploy the same repository.

## Configure once in Netlify

1. Open Netlify > agrivaai > Project configuration > Environment variables.
2. Add these variables using values from the same Supabase project as the AGRIVA marketplace:

   - NEXT_PUBLIC_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = the project's public/anon key.

   The backend also accepts NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_ANON_KEY or SUPABASE_PUBLISHABLE_KEY for the public key; SUPABASE_URL can supply the URL. Prefer the NEXT_PUBLIC_ variable names for compatibility with the rest of AGRIVA.

   IMPORTANT: Never use service_role or Supabase secret keys in place of the public/anon/publishable key. Do not commit public or private keys to the repository.

3. Include the Deploy Previews context and the Builds and Functions scopes (or All scopes).
4. Trigger a new deploy preview or redeploy after saving the variables. An existing build is not automatically reconfigured.
5. Visit the NEW preview's /api/search/visual-index endpoint. Correct setup returns JSON with products, indexedCount and method, populated from public active marketplace products.

## Error diagnosis

- HTTP 503 with VISUAL_SEARCH_MISSING_CONFIG: URL/key absent, invalid or missing from Netlify Functions scope or deployment context.
- HTTP 503 with Visual catalogue unavailable: check Supabase project and public SELECT/RLS policies.
- HTTP 200 with indexedCount equal to zero: verify product image URLs and image indexing logs.

## Cost and privacy

- Only public AGRIVA product images are downloaded by the server, and their fingerprints are cached.
- Uploaded visitor photos stay in their browser, including optional on-device CLIP semantic matching.
- No paid Vision/LLM API is involved.
- Never bypass missing preview variables by using a privileged database key.

Netlify references:
- https://docs.netlify.com/build/environment-variables/get-started/
- https://docs.netlify.com/build/environment-variables/overview/
- https://docs.netlify.com/deploy/deploy-types/deploy-previews/
