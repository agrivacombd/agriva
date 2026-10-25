# AGRIVA Product Information Architecture & URL Masterplan

Last updated: 2026-10-25

## Goals

- Make AGRIVA easy to navigate for farmers on mobile first, without making desktop workflows feel cramped.
- Keep one stable, descriptive URL per feature; avoid duplicate pages that compete in search.
- Organize features around user jobs-to-be-done: get farming help, plan a crop, buy/sell, manage a farm, and find work.
- Only index public, useful pages. Private workspaces and query-driven search results should not be SEO landing pages.
- Do not promise live inventory, job availability, weather accuracy, or AI diagnosis unless the data/service supports it.

## Primary navigation and ranking

### Home page
1. Hero smart search: /search (main discovery entry point).
2. Core farming support: /ai, /crop-disease, /weather.
3. Inputs and decisions: /marketplace, /market-prices, /crop-calendar, /tools, /soil-fertilizer, /crop-choice.
4. Farm work: /farms (personal workspace; do not index).
5. Commerce and logistics: /sell-harvest, /buyer-demands, /transport.
6. Learning: /learn.
7. Careers: /jobs and /jobs/cv-builder in a dedicated career section and quick access.

The homepage services grid is ordered by common, high-value farming tasks. Career features remain in a separate section so they are visible without displacing core farming support. The mobile bottom navigation is intentionally limited to five items: Home, Search, Tools, Jobs, Marketplace. Disease support, weather, farm records and learning remain available through the homepage and tools directory.

## Canonical URL and page map

| User need | Canonical URL | Page/slug rule | Indexing |
|---|---|---|---|
| Home / discover | / | One homepage only | Index |
| Smart search | /search | Search terms are query/form input, not new landing-page slugs | Noindex/disallow crawl |
| AI agriculture assistant | /ai | Keep stable short slug | Index only if useful public content is rendered |
| Crop disease support | /crop-disease | One disease-help entry point; do not create duplicate /disease | Index |
| Weather | /weather | Location selection stays in the UI; do not generate thin URL variants | Index |
| Agriculture marketplace | /marketplace | Main marketplace landing page | Index |
| Product details | /marketplace/{product-slug} only if the matching dynamic route exists and the product is active/approved | Lowercase, hyphenated, stable, unique slug; no IDs or tracking params | Index active approved products only |
| Market prices | /market-prices | Landing page links to dated/official source; do not fabricate daily prices | Index |
| Farm tools directory | /tools | Directory for calculators and planning tools | Index |
| Crop calendar | /crop-calendar | One calendar page; saved state stays local/user-specific | Index |
| Crop choice comparison | /crop-choice | One simulator page; user inputs do not become indexable URLs | Index |
| Soil/fertilizer planner | /soil-fertilizer | One planner page; recommendations depend on report/advice entered | Index |
| Farm workspace | /farms | Personal records, not public farm pages | Noindex; protect user data |
| Learning centre | /learn | Lessons can later use /learn/{lesson-slug} only when each lesson has unique, reviewed content | Index |
| Blog | /blog | Article detail uses /blog/{article-slug}; only published/reviewed articles are indexable | Index published content only |
| Jobs marketplace | /jobs | Main job search and posting entry point | Index |
| Job details | /jobs/{job-slug} | Existing job slug; lowercase hyphenated, unique, stable; expired/unpublished jobs must not stay indexable | Index published, open jobs only |
| CV Builder | /jobs/cv-builder | Keep nested under jobs; do not add competing /cv-builder or /career/cv aliases | Index |
| Sell harvest | /sell-harvest | Seller flow and public offers only when offer pages are actually supported | Index landing page; review offer detail routes separately |
| Buyer demand board | /buyer-demands | Public demand board; private contact details must be protected | Index landing page |
| Transport | /transport | Booking/request flow; personal booking details stay private | Index landing page only |
| Dashboard | /dashboard | Authenticated user workspace | Noindex/private |
| Admin | /admin/* | Staff-only | Noindex/private |
| Auth and orders | /auth/*, /orders | Transactional/private | Noindex/private |

## Slug rules

- Use lowercase Latin characters and hyphens for stable public slugs; use Bengali in page copy and titles, not in URL paths.
- Keep URLs short and intent-led: /jobs/cv-builder, not /tools/cv-making-tool-free-bangladesh.
- Do not rename existing routes solely for keyword stuffing. If a route must change, add a permanent redirect from the old URL, update canonical/internal links/sitemap, and verify the redirect chain.
- Job and product detail slugs must be unique and immutable after publication where possible. If a title changes, retain the old slug or redirect it.
- Do not put user-entered search terms, personal data, phone numbers, or IDs in public URLs.
- Use one canonical host (https://agriva.com.bd), HTTPS, self-referencing canonicals, and consistent trailing-slash behavior.

## SEO and publishing rules

- Sitemap contains indexable static landing pages plus only active/approved products, published/open jobs, and published articles.
- Do not include private workspaces, search results, drafts, rejected articles, expired jobs, or unapproved product records.
- CV Builder has page-level metadata and a canonical URL. CV content must remain local/private unless a user explicitly exports or shares it.
- Keep job detail metadata and JobPosting structured data synchronized with actual publication/deadline state; remove expired jobs from the sitemap.
- Blog landing page must list real published articles before it is promoted as an active content hub. A placeholder page should not be used to imply that articles are already available.
- Marketplace sample/preview products must never look like real purchasable inventory.
- Use breadcrumbs and contextual links: Home → category/section → detail. Every important page should have a clear route back to its parent.
- Validate sitemap and robots output in production after deployment; robots rules do not replace authentication or database security.

## UX rules

- Mobile bottom navigation has five high-frequency destinations; keep labels short and tap targets large.
- Desktop top navigation should expose the main destinations, with tools and career links grouped logically.
- Use descriptive link text (e.g. “কৃষি চাকরি খুঁজুন”, “CV তৈরি করুন”), not generic “Click here”.
- Group related tools by task and avoid repeating the same cards in several sections unless the repeated shortcut serves a different journey.
- Show empty states when no approved products/jobs exist; do not fill production with fake availability.
- Make language, data freshness, source, and AI limitations clear where relevant.
- Keep forms short, preserve user input after validation errors, and make mobile keyboards appropriate to the field.

## Implementation checklist

- [x] Keep existing public URLs stable.
- [x] Re-rank homepage tools around core farming needs and put careers in a dedicated section.
- [x] Add jobs and CV Builder to homepage quick access and mobile navigation.
- [x] Add core public tool pages and CV Builder to the sitemap.
- [x] Add page-level metadata/canonical for CV Builder.
- [x] Align robots rules with public pages and exclude search/private workspaces from crawling.
- [ ] Verify the production homepage is the intended AGRIVA platform page (the live root has previously differed from the repository homepage).
- [ ] Confirm that the product-detail route matches the sitemap's /marketplace/{product-slug} pattern.
- [ ] Verify all sitemap URLs return 200, have canonical tags, and contain meaningful content.
- [ ] Test mobile and desktop navigation, keyboard access, and low-bandwidth behavior.
- [ ] Check Search Console indexing, Core Web Vitals, real job/product data, and analytics after deployment.
