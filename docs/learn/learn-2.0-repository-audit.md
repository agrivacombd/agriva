# AGRIVA Learn 2.0 — Repository Audit & Implementation Plan

**Status:** Phase 0 audit baseline  
**Repository:** `agrivacombd/agriva`  
**Base commit audited:** `eb75ef599d6a421ac8b9401e473505487b0c200b`  
**Feature branch:** `feat/learn-2.0-phase1`

## 1. Verified current implementation

### Public routes
- `/learn`: server-rendered static landing page in `app/learn/page.tsx`.
- `/learn/[slug]`: static guide route in `app/learn/[slug]/page.tsx`; static params are generated from `LESSONS`.
- `/learn/plant-science`: existing interactive Plant Science Academy; keep and integrate, do not recreate.
- `/learn/plant-disease`: existing Plant Disease Learning Lab; keep and integrate, do not recreate.

### Content and interaction
- `lib/learn/lessons.ts` currently exports four hard-coded guides: rice cultivation, vegetable cultivation, soil health, and integrated pest management.
- Each guide currently has an intro, ordered steps, tips, and one multiple-choice quiz.
- `components/learn/LessonReader.tsx` renders the guide and evaluates its single quiz client-side. It does not persist learner progress or quiz history.
- `components/learn/ReportCorrectionForm.tsx` exists and is used by the disease learning module; preserve its existing workflow.
- Plant Science Academy and Disease Learning Lab are substantial existing implementations and must remain route-compatible.

### Metadata
- The Learn index and guide pages already define page-specific titles, descriptions, canonical URLs and Open Graph metadata.
- Guide content is statically available to server rendering and static route generation.

## 2. Verified data and platform baseline

- Existing production Supabase project is the AGRIVA project already linked to this repository.
- Existing `profiles` table includes user roles relevant to learners (including farmer, student, agronomist and gardener).
- Existing authentication is Supabase-based and should be reused.
- The production public schema currently has no dedicated Learn LMS tables (no `learn_*`, course, lesson-progress, quiz-attempt or bookmark tables were found in the table inventory).
- Existing tables and policies are protected by RLS. This project has a history of careful permission hardening; any future Learn tables must follow the same standard.
- **No production database writes or migrations were performed during this audit.**

## 3. Architecture decisions

1. Keep the initial implementation as a modular monolith inside the existing Next.js application.
2. Keep public guide pages server-rendered and preserve all current public URLs.
3. Treat the current TypeScript guide catalog as the source of truth in Phase 1; do not introduce a CMS/database dependency before the content workflow is designed and tested.
4. Reuse the existing authentication provider and existing Academy/Disease Lab modules.
5. Add learner persistence only after the data model, ownership policies, and account UX are reviewed.
6. Do not expose quiz answer keys to unauthenticated/browser payloads in any future persisted assessment engine.
7. Require technical review and source attribution for high-risk agricultural recommendations.
8. Do not present symptom matching as definitive diagnosis or generate unverified chemical dosage advice.
9. Keep future database migrations additive and backward-compatible.

## 4. Phase 1 scope

- Improve Learn homepage information architecture and visual hierarchy.
- Add accessible search over the current guide catalog.
- Add category/crop filters based on existing guide metadata.
- Add a seasonal-learning section only where content is evidence-backed; avoid invented crop calendars.
- Improve guide discovery cards and guide detail navigation.
- Add a structured content metadata contract that can later support database-backed CMS migration.
- Integrate links to existing Plant Science Academy and Disease Learning Lab.
- Preserve Bengali-first content, responsive layout, SEO metadata, and safety notices.

## 5. Later phases (not part of the first UI release)

### Phase 2 — Learner system
- Bookmarks, enrollment, lesson progress, quiz history and My Learning dashboard.
- Add dedicated tables only after schema and RLS design review.
- Use unique ownership constraints such as (user_id, content_id) and (user_id, lesson_id).

### Phase 3 — Practical learning
- Media learning, transcripts, downloadable resources, and interactive practice modules.
- Reuse existing tools where possible.

### Phase 4 — Content operations
- Authoring, technical review, publishing workflow, content freshness and audit trail.

### Phase 5 — Advanced capabilities
- Certificates, offline learning, semantic search and AI learning assistance only when justified by demand and operational readiness.

## 6. Phase 1 acceptance criteria

- Existing Learn guide URLs still resolve.
- Plant Science Academy and Disease Learning Lab remain functional and reachable.
- Search and filters work with keyboard and touch input.
- No unverified seasonal prescriptions are introduced.
- Guide body remains server-rendered.
- Page metadata and canonical URLs remain correct.
- No production schema changes are made in Phase 1.
- Lint, TypeScript, regression tests and production build pass.
- Preview browser QA is completed before merge/deployment.

## 7. Audit limitations

This is a repository and schema inventory, not a full browser-based functional audit. No claim is made that every Academy or Disease Lab interaction has been exercised in a browser. Production data was inspected read-only; no records were changed.
