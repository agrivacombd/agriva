# Bulk RFQ release validation — AGRIVA

## Implemented (feature branch, not production)
- /bulk-orders: moderated public listing, sanitized public data only
- /custom-order: login-first B2B/B2C request, visibility choice
- /account/custom-orders: persistent paginated history, reorder with owner-only prefilling and new ID, approved offer counts
- /account/custom-orders/[id]: eligible quote comparison including unit price, shipping and fees; select once
- /wholesaler/requests: authenticated wholesaler invitations with quotation submission
- /wholesaler/orders: selected supplier can track awarded orders even after invitation expires
- /admin/custom-orders: verified supplier business names, identity verification, invites, moderation, quote approval, manual fulfillment status transitions
- Database migrations: initial RFQ, public listing hardening, request rate limit, quote integrity, fulfillment, supplier names, corrected RLS cross-request matching, timestamp guards, selected supplier fulfillment access

## Verified on staging (agriva-editorial-staging, NOT production)
- Database migrations applied and tables RLS enabled.
- SQL permission checks: anonymous principal cannot access private request/quote tables or privileged RPC; public listing read is allowed.
- Corrected two vulnerable ambiguous invitation policy predicates; verified that an invited supplier cannot bid on an uninvited request.
- Resolved RLS recursion for verified supplier names via a narrow private-schema helper; verified buyers can read approved supplier name and outsiders cannot.
- Request timestamps are now server-owned; client cannot bypass rate limits by backdating them.
- Selected supplier retains assigned order access after invite expiration; simulated transaction test passed.
- SQL transaction simulation using two pre-existing staging accounts: buyer request -> admin publish -> supplier verification and invite -> quote -> approval -> buyer selection -> manual fulfillment to completed; transaction rolled back.
- Second selection denied; non-admin privileged RPC attempts denied; duplicate rapid request denied; no fixture rows retained.
- Supabase security advisor: no new ERROR findings. Remaining warnings include authenticated callable guarded SECURITY DEFINER functions and unrelated leaked-password setting.
- Vercel Git preview compiles on several commits; confirm *head commit* READY before merging.

## Mandatory before production
1. Confirm preview deployment environment uses this **staging** Supabase project, not production.
2. Perform actual signed-in HTTP/browser flow with separate buyer, admin and verified wholesaler users (also a competing wholesaler), including privacy boundaries, rejected quote, expired invite and rate limit.
3. Validate supplier onboarding with existing AGRIVA module permissions and organizations, including real verified business accounts.
4. Test mobile responsiveness, screen readers/keyboard, Bangla unit labels, invalid input, 429/rate controls and notifications; add automated Playwright HTTP integration tests.
5. Ensure reliable buyer and supplier notifications are configured or prominently tell users to check dashboards; manual invite link delivery is currently required.
6. Decide whether multi-item RFQs, partial quantities, invoices, payments, automated shipping and commissions belong in initial release. They are **not** implemented by this MVP.
7. Compare migrations against current production schema and back up production. Apply all additive migrations safely before introducing UI routes. Review verified supplier capabilities and Data API exposure. Run Supabase advisors again.
8. Confirm Vercel final preview build READY and authenticated browser tests pass. Require PR approval and release controls before merging to main.
9. Monitor 403/401/500 errors and Postgres policy decisions after deployment. Keep feature off or rollback if unexpected exposure occurs.

## Safety note
Never equate accepting a quotation with collecting money. It only marks supplier selection; admin must confirm fulfillment. No customer payment is requested or processed by this code.
