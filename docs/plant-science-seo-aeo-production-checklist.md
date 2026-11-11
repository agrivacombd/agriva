# Plant Science production SEO/AEO release checklist

## Implemented in this branch

- Bengali page title, description, canonical URL, robots directives, Open Graph and Twitter metadata.
- Server-rendered structured data for the collection page, visible FAQ content, and breadcrumb trail.
- Site-wide Organization and WebSite entities with stable IDs.
- Plant Science collection URL in the XML sitemap.
- OAI-SearchBot access to public pages, with explicit exclusions for admin, seller, dashboard, API, authentication, orders, and farm-private paths.
- Evidence-aware FAQ copy: the catalogue is not represented as a list of only native Bangladesh species; missing vernacular names are not guessed; catalogue inclusion is not equated with accepted taxonomy or confirmed occurrence.
- CI regression coverage for the page metadata, JSON-LD, visible FAQ, sitemap entry, and crawler exclusions.

## Required checks after a successful production deployment

1. Fetch `https://agriva.com.bd/learn/plant-science` and inspect the raw HTML response (not only the hydrated browser view) for the title, description, canonical, H1, visible FAQ text, and JSON-LD graph.
2. Fetch `https://agriva.com.bd/robots.txt` and `https://agriva.com.bd/sitemap.xml`; confirm the collection URL is present and private paths remain disallowed for OAI-SearchBot.
3. Validate JSON-LD with Schema.org Validator. Treat Google's Rich Results Test as a separate eligibility check; FAQ markup does not guarantee a Google FAQ rich result.
4. Submit or inspect the canonical URL in Google Search Console URL Inspection. Check indexing eligibility, selected canonical, crawl status, and rendered HTML.
5. Submit the sitemap in Google Search Console and Bing Webmaster Tools; monitor discovered and indexed URLs rather than assuming submission guarantees indexing.
6. Check mobile usability, Core Web Vitals/field data, response status, redirects, and image loading on the deployed route.
7. Recheck source links and all public botanical claims. Do not create indexable individual taxon pages or add Taxon schema until each taxon has a reviewed name concept, Bangladesh occurrence evidence, and traceable sources.

## Release limitations

- CI validates source-level contracts and the production build; it cannot prove that search engines have crawled, indexed, ranked, or cited the page.
- No Search Console/Bing Webmaster account action is implied by this code change.
- FAQ and structured data improve machine-readable context but do not guarantee AI citations, featured snippets, or rankings.
- The catalogue remains a learning resource with pending taxonomic review. Exact-string uniqueness is not synonym reconciliation or proof of Bangladesh occurrence.
