# AGRIVA Admin 2.0 — Repository & Production Audit

Audit date: 2026-11-28
Repository: agrivacombd/agriva
Base branch: main
Development branch: feat/agriva-admin-2.0
Production deployment: Vercel project agriva-p8g6, latest observed deployment READY
Database: Supabase project supabase-coral-clock (dhqaepsbuwhbynagfxpf), ACTIVE_HEALTHY

## Existing capabilities — do not duplicate

The repository already contains 30 admin route pages, including:
- Dashboard and module directory
- Products, categories, seed information, orders, harvest, Plant Market, Green Exchange
- Users, identity verification, seller applications, transport, jobs
- Finance, reports
- Articles, Content Studio, AI Content, content drafts
- SEO dashboard, SEO pages, search intelligence, opportunities
- Access control, audit log, settings

Existing platform foundations also include:
- AdminShell with responsive navigation and order notification bell
- Server-side requireAdminPage authorization boundary
- Capability-based admin authorization and delegated permission service
- Application review history and seller approval workflow
- Existing smoke tests and broad GitHub Actions CI

## Production security advisor observations

Observed findings (2026-11-28):
- 4 RLS-enabled tables with no policies: crop_health_feed_slug_registry, marketplace_order_idempotency, product_rank_daily_metrics, product_rank_events.
- Mutable search_path warning on public.crop_feed_make_slug().
- SECURITY DEFINER execute grants reported for anon/authenticated roles. Each function must be reviewed individually for intended public/client use and internal authorization checks before changing grants.
- Performance advisor reports auth-function policy evaluation patterns and multiple permissive policies. These are optimization candidates, not automatic permission changes.
- 50 unused-index observations are informational; do not drop indexes without workload and query-plan evidence.

No production database changes were made during this audit.

## Admin 2.0 implementation principles

1. Preserve the existing admin auth boundary. Every page, Server Action and Route Handler must authorize independently.
2. Reuse existing modules and routes. New command center is an aggregation/entry point, not a duplicate CRM, finance or notification system.
3. Read-only analytics first; no destructive or financial operations from summary widgets.
4. Never expose service-role credentials or user secrets to client components.
5. Use test fixtures and synthetic accounts for browser QA; do not use production customer data.
6. Keep all work on feat/agriva-admin-2.0. Do not merge or deploy to production as part of this task.

## Roadmap

### Phase 1 — Command Center & operational visibility
- Premium executive command center built from existing authorized tables
- Actionable links to existing queues
- Data-unavailable states that never misrepresent missing metrics as zero
- Responsive and accessible navigation

### Phase 2 — Growth & engagement
- Added read-only Demand & RFQ Intelligence at /admin/demand-intelligence, reusing bulk_requests, bulk_quotes and bulk_wholesalers with existing admin RLS.
- Added read-only Growth & Engagement Intelligence at /admin/growth-intelligence using exact 30-day and six-calendar-month counts from profiles, marketplace_orders, order_events and attribution_sessions; no user-level or visitor-token data is exposed.
- Reuses the existing 30-second admin order notification feed; clearly distinguishes it from customer marketing push.
- Records measurement gaps: no durable session/retention telemetry or push delivery/open telemetry is currently available, so DAU/MAU, retention and customer push performance are not fabricated.
- Integrate customer notification delivery and privacy-safe engagement tracking after the event schema and delivery provider are reviewed
- Demand/supply matching visibility
- Cohort and retention analytics where event data exists
- Campaign and conversion reporting

### Phase 3 — Intelligence
- AI assistant grounded in authorized aggregate data
- Fraud/risk signals with human review
- Forecasting only after data quality and historical coverage checks

### Phase 4 — Enterprise governance
- Review existing RBAC, audit logs and security boundaries
- Step-up authentication for high-risk actions
- Backup and system-health visibility

## Verification gates
- Existing and new admin smoke tests
- ESLint and TypeScript
- Production build with CI placeholders only
- Supabase security/performance advisor recheck after any database change
- Browser QA on preview with synthetic test data (currently blocked: Vercel deployment API has reached its 100-deployments/day free quota; retry after quota reset or use team-approved CLI deployment).
- No production deployment without explicit later instruction
