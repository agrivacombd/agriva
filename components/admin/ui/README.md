# AGRIVA Admin Design System

The shared admin visual language is defined in `admin-design-system.css` and reusable React primitives in `AdminPrimitives.tsx`.

## Foundations
- **Palette:** AGRIVA forest green for navigation and primary actions; warm neutral canvas and white surfaces; semantic success, warning, danger, and info tones.
- **Spacing:** Tailwind's 4px spacing scale; page gutters use responsive `clamp()`.
- **Shape:** 10px controls, 14px panels, 18px cards, 22px hero surfaces.
- **Elevation:** restrained card shadow; stronger elevation reserved for menus and overlays.
- **Typography:** strong page hierarchy, muted supporting copy, tabular numerals for metrics.
- **Accessibility:** visible keyboard focus, semantic headings/regions, reduced-motion support, responsive overflow containers.

## Components
- `AdminPage`: standard page width and responsive page padding.
- `AdminPageHeader`: consistent eyebrow, title, description, and action alignment.
- `AdminPanel`: shared surface, border, radius, and elevation.
- `AdminSectionHeader`: consistent section title and optional action.
- `AdminMetricCard`: reusable linked or static KPI card.
- `AdminStatusBadge`: semantic status tones.
- `AdminEmptyState`: consistent empty states with optional next action.
- `AdminTableFrame`: scroll-safe table surface.

## Adoption rules
1. Use the primitives for new admin pages; migrate existing modules in small reviewed batches.
2. Do not duplicate color hex values when a semantic token exists.
3. Keep data access, authorization, server actions, and business rules outside presentation primitives.
4. Use real permission checks to hide/disable actions; navigation visibility is not authorization.
5. Preserve mobile usability: no page-level horizontal overflow, touch targets at least 40px, tables scroll within their own frame.
6. Use semantic status tones consistently and never communicate status by color alone.
