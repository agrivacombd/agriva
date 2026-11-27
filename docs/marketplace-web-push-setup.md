# AGRIVA Marketplace Web Push setup

This feature is opt-in. The browser asks for notification permission only after a signed-in user presses **Push চালু করুন** on `/notifications/preferences`.

## Architecture

- The authenticated Next.js routes validate browser subscriptions and write them with the server-only Supabase service role.
- `push_subscriptions` is not directly readable or writable by `anon` or `authenticated` clients.
- A database trigger creates a server-only outbox row only when that user's `push_enabled` preference is true.
- Supabase Cron calls the `push-delivery` Edge Function once per minute through `pg_net`.
- The Edge Function atomically claims work, sends VAPID Web Push, removes expired endpoints (HTTP 404/410), and retries transient errors with exponential backoff. Five failed attempts move an item to `failed`.
- The service worker displays the notification and opens only same-origin AGRIVA URLs when clicked.

The cron function safely does nothing until all three Vault values below exist. No user data or subscription endpoint is sent to third parties other than the browser's own push provider.

## Required keys

Generate a VAPID key pair in a trusted local terminal:

```bash
npx --yes web-push generate-vapid-keys
```

Create a separate high-entropy dispatch secret:

```bash
openssl rand -base64 48
```

Keep the VAPID private key and dispatch secret private. Never put either in a `NEXT_PUBLIC_*` variable or commit them to Git.

## Supabase Edge Function secrets

After the migration and function are ready in the target Supabase environment:

```bash
supabase secrets set --project-ref <project-ref> \
  VAPID_PUBLIC_KEY="<public-vapid-key>" \
  VAPID_PRIVATE_KEY="<private-vapid-key>" \
  VAPID_SUBJECT="mailto:<support-contact>" \
  PUSH_DISPATCH_SECRET="<dispatch-secret>"

supabase functions deploy push-delivery --project-ref <project-ref>
```

The function uses Supabase's built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` runtime variables.

## Supabase Vault dispatcher secrets

Run these statements in the target project's SQL Editor after replacing placeholders. The service-role key is stored encrypted in Vault because the database cron job needs it to invoke the protected Edge Function.

```sql
select vault.create_secret(
  'https://<project-ref>.supabase.co',
  'agriva_push_delivery_project_url'
);

select vault.create_secret(
  '<service-role-key>',
  'agriva_push_delivery_service_role_key'
);

select vault.create_secret(
  '<same-dispatch-secret>',
  'agriva_push_delivery_secret'
);
```

The migration installs the one-minute cron schedule. Check it with:

```sql
select jobname, schedule, active
from cron.job
where jobname = 'agriva-marketplace-push-delivery';
```

## Next.js environment

Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the matching public VAPID key in the Vercel Preview environment for the AGRIVA development branch. It is public by design. The authenticated subscribe routes also require the existing server-only `SUPABASE_SERVICE_ROLE_KEY`; never expose it to the browser.

Only after preview QA passes should the same public key be added to Production and the production migration/function/secrets be configured. Do not run the production migration or deploy the production function as part of development QA.

## Manual QA

1. Sign in with a synthetic test account on the preview deployment.
2. Open `/notifications/preferences` and press **Push চালু করুন**. Confirm the browser permission prompt appears only after the click.
3. Confirm a row exists for that test user in `push_subscriptions` and `notification_preferences.push_enabled = true`.
4. Insert a synthetic notification for that user. Confirm one queue row is created and the browser receives a notification within approximately one minute.
5. Click the notification and confirm it opens the intended same-origin AGRIVA page.
6. Turn push off and confirm the device subscription is removed and the preference is false when no other devices remain.
7. Test a stale endpoint and a transient provider failure in an isolated environment; stale 404/410 endpoints should be deleted and transient failures retried.
8. Never use production users, production subscriptions, or real marketplace records for QA.
