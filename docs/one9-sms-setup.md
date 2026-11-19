# One9 SMS setup for AGRIVA

This integration has two separate runtime locations:

- Supabase Edge Function `send-sms` handles Supabase Auth OTP delivery (phone sign-in, signup and phone-based password reset).
- The Next.js server uses `ONE9_SMS_API_KEY` for COD order confirmation and order-status notifications.

## Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, add:

- `ONE9_SMS_API_KEY`: the API key from the One9 dashboard.
- `SEND_SMS_HOOK_SECRET`: the exact generated Send SMS Hook secret, including its `v1,whsec_` prefix.

Do not commit either value, paste it into chat, or expose it in a `NEXT_PUBLIC_*` variable.

Deploy `supabase/functions/send-sms/index.ts` as the `send-sms` function with **Verify JWT with legacy secret OFF**. The function verifies the Supabase Standard Webhooks signature itself.

## Supabase Auth Hook

After the function is deployed, open Authentication → Hooks → Add Send SMS hook:

- Hook type: HTTPS
- URL: `https://dhqaepsbuwhbynagfxpf.supabase.co/functions/v1/send-sms`
- Secret: the same `SEND_SMS_HOOK_SECRET` value stored in Edge Function secrets

Create/enable the hook only after the function and both secrets are deployed. Phone Auth must be enabled in Authentication → Providers.

## Vercel server environment

Set `ONE9_SMS_API_KEY` in the AGRIVA Vercel project for Preview and Production environments. It is read only by server-side code. Do not add a `NEXT_PUBLIC_` version.

## Sender ID and billing checks

The code requests sender ID `AGRIVA`. Delivery is not guaranteed until One9 approves that masking Sender ID for the account and confirms the applicable route, per-SMS rate, and available balance. A successful HTTP response from the API should be confirmed against One9 delivery reports before enabling customer-facing SMS.

Do not send a live test SMS without an explicitly approved test recipient. Order checkout and status transitions remain successful if SMS delivery fails.

## Release safety

The feature branch and PR do not enable the Auth Hook or deploy the Edge Function to the production Supabase project. Production rollout requires a separate approval after CI, Preview, sender-ID approval, and a controlled test.
