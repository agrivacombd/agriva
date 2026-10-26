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

## Current implementation state

The admin-only readiness endpoint reports whether the required environment variables are present. It does not connect Google, read tokens, or fetch Search Console data. A complete OAuth callback and encrypted token persistence are still required.
