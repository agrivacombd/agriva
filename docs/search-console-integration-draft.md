# Google Search Console integration — draft setup

This integration is intentionally not connected to production yet.

## Required Vercel environment variables

Set these only after reviewing the OAuth flow and approved redirect URL:

- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`
- `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI` — exact callback URL for the deployment
- `GOOGLE_SEARCH_CONSOLE_TOKEN_ENCRYPTION_KEY` — high-entropy server-only key used to encrypt stored refresh tokens

Never expose any of these through a `NEXT_PUBLIC_*` variable, client component, response payload, logs, or source control.

## Google Cloud setup

1. Create or select a Google Cloud project owned by AGRIVA.
2. Enable the Google Search Console API.
3. Configure the OAuth consent screen and add only the necessary administrators as test users while the app is in testing.
4. Create a Web application OAuth client.
5. Register the exact callback URL from `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI`.
6. Request the minimum read-only scope: `https://www.googleapis.com/auth/webmasters.readonly`.
7. Confirm the Google account has access to the intended Search Console property.

## Security and data integrity requirements

- Use server-side OAuth state with a short expiry and one-time validation.
- Store refresh tokens encrypted at rest; never send tokens to the browser.
- Restrict token access to server-side admin code and keep RLS enabled.
- Fetch only verified properties and display the property URL in the admin UI.
- Sync query, page, country, device, date, clicks, impressions, CTR, and average position with source and date range.
- Handle expired/revoked consent, API quota errors, pagination, and empty result sets.
- Label source and date range; do not merge internal AGRIVA search counts with Google metrics.
- Do not show metrics until OAuth succeeds and the first sync completes.
- Keep all schema changes as a migration in the draft PR; do not apply migrations to production without explicit approval.

## Draft implementation state

- Admin-only OAuth start and callback routes use a one-time, short-lived, HttpOnly state cookie.
- The callback requests the read-only Search Console scope and stores the refresh token encrypted with AES-256-GCM. The server derives the 256-bit key from the server-only encryption secret using SHA-256; keep that secret stable or existing tokens will become unreadable.
- The connection table migration is included in this draft branch only. It has not been applied to Supabase.
- The admin UI can start the OAuth flow and reports whether a connection row exists.
- Property listing/verification, token refresh, Search Analytics queries, sync persistence, and metrics display are not implemented yet. A successful OAuth connection alone does not mean analytics are available.
- OAuth cannot be tested until the four server environment variables and exact Google OAuth redirect URI are configured. Do not add credentials to source control.

Before production use, review the migration/RLS policy, run CI, test OAuth and token encryption in a non-production environment, implement property verification and metrics sync, and explicitly approve any production migration/deployment.
