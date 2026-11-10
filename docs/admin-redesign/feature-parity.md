# AGRIVA Admin redesign — feature parity baseline

This document is the migration checklist for the responsive admin redesign.
The shared shell is in place and the first page migrations cover the dashboard,
catalogue, and order operations. This is a UI/layout migration: routes, data
queries, Server Actions, RPC contracts, and authorization boundaries must remain
unchanged. A checked layout item does not mean authenticated functional QA has
already passed.

## Existing route inventory

| Route | Existing area | Parity requirement |
|---|---|---|
| /admin | Dashboard, orders, commissions, payouts, learning correction inbox | Preserve metrics, queue data, order transitions, commission/payout actions |
| /admin/access-control | Roles and capabilities | Preserve delegated permission checks and role management |
| /admin/ai-content | AI content dashboard | Preserve current workflow and access boundary |
| /admin/articles | Article review queue | Preserve draft listing and review links |
| /admin/articles/[id] | Article editor/review | Preserve existing editor actions |
| /admin/audit | Audit log | Preserve filters, records, and export behavior |
| /admin/categories | Category/taxonomy management | Preserve taxonomy operations |
| /admin/content-drafts | Content drafts | Preserve existing draft client workflow |
| /admin/content-studio | AI content brief generation | Preserve brief generation behavior |
| /admin/finance | Commissions and payouts | Preserve existing finance operations |
| /admin/green-exchange | Green Exchange moderation | Preserve moderation actions |
| /admin/harvest | Harvest moderation | Preserve approve, pause, reject and notes |
| /admin/identity-verification | Identity review | Preserve approval/rejection and private evidence access |
| /admin/jobs | Job moderation | Preserve publish, reject, pause and filled states |
| /admin/opportunities | Opportunity management | Preserve current list and actions |
| /admin/orders | Order management | Preserve order review and transitions |
| /admin/plant-market-products | Plant Market product review | Preserve review and moderation |
| /admin/products | Product catalogue | Preserve create/edit, taxonomy, descriptions, images and status |
| /admin/reports | Reports | Preserve existing report views and CSV export |
| /admin/search-intelligence | Search intelligence | Preserve current discovery signals |
| /admin/search-intelligence/opportunities | Search opportunities | Preserve existing opportunity workflow |
| /admin/seller-applications | Seller applications | Preserve review and decision workflow |
| /admin/seo-pages | SEO landing pages | Preserve metadata, FAQ schema and publishing workflow |
| /admin/settings | Site settings | Preserve supported configuration |
| /admin/transport | Transport partner operations | Preserve verification and moderation |
| /admin/users | User administration | Preserve user listing and permitted role changes |
| /super-admin | Admin module directory | Keep existing route and module search available |

## Shared shell and page migration status

- [x] Preserve the /admin server-side dashboard.read guard.
- [x] Add one shared responsive sidebar and mobile navigation drawer.
- [x] Keep desktop navigation persistent; use a compact icon rail at large-screen widths.
- [x] Provide active-route indication and keyboard-visible focus states.
- [x] Keep user dashboard navigation available.
- [x] Keep all existing page routes.
- [x] Dashboard layout: responsive metric cards, quick actions, mobile order cards, desktop order table.
- [x] Products layout: remove duplicate page header; align create/edit forms with shared content width and responsive spacing.
- [x] Categories layout: remove duplicate page header; align create/edit forms with shared content width and responsive spacing.
- [x] Orders layout: remove duplicate page header; retain order cards and COD collection audit workflows.
- [ ] Verify dashboard order status, commission, and payout actions with authorized roles.
- [ ] Verify product create/edit, taxonomy, description, and image workflows.
- [ ] Verify category create/edit and ordering workflows.
- [ ] Verify order status transitions and COD collection audit workflow.
- [ ] Run repository build, lint, and admin regression scripts in a full checkout.
- [ ] Manually verify authenticated pages at mobile, tablet, and desktop breakpoints.

## Security and migration rules

1. Sidebar links are navigation only; they never grant access.
2. Keep every existing page, Server Action, and API authorization check.
3. Do not change Supabase queries, RPC contracts, or data mutation behavior in the shell migration.
4. Migrate individual pages to shared responsive table/card primitives only after their existing behavior is captured in a page-specific parity check.
5. Do not merge this branch until automated checks and authenticated visual QA pass.
