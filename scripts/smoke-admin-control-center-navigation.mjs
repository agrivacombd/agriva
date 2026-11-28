#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const pageRoutes = [
  "app/admin/access-control/page.tsx",
  "app/admin/ai-content/page.tsx",
  "app/admin/articles/[id]/page.tsx",
  "app/admin/articles/page.tsx",
  "app/admin/audit/page.tsx",
  "app/admin/categories/page.tsx",
  "app/admin/command-center/page.tsx",
  "app/admin/content-drafts/page.tsx",
  "app/admin/content-studio/page.tsx",
  "app/admin/custom-orders/page.tsx",
  "app/admin/demand-intelligence/page.tsx",
  "app/admin/finance/page.tsx",
  "app/admin/green-exchange/page.tsx",
  "app/admin/growth-intelligence/page.tsx",
  "app/admin/harvest/page.tsx",
  "app/admin/identity-verification/page.tsx",
  "app/admin/jobs/page.tsx",
  "app/admin/opportunities/page.tsx",
  "app/admin/orders/page.tsx",
  "app/admin/page.tsx",
  "app/admin/plant-market-products/page.tsx",
  "app/admin/plant-market-applications/page.tsx",
  "app/admin/products/page.tsx",
  "app/admin/reports/page.tsx",
  "app/admin/search-intelligence/opportunities/page.tsx",
  "app/admin/search-intelligence/page.tsx",
  "app/admin/seed-information/page.tsx",
  "app/admin/seller-applications/page.tsx",
  "app/admin/seo-pages/page.tsx",
  "app/admin/seo/page.tsx",
  "app/admin/settings/page.tsx",
  "app/admin/transport/page.tsx",
  "app/admin/users/page.tsx",
];

for (const route of pageRoutes) assert.ok(existsSync(route), `Admin page route missing: ${route}`);

for (const route of pageRoutes) {
  const source = readFileSync(route, "utf8");
  if (route.endsWith("articles/[id]/page.tsx")) {
    assert.match(source, /redirect\(/, "Legacy article detail route must preserve its redirect workflow");
  } else if (route.endsWith("identity-verification/page.tsx") || route.endsWith("seller-applications/page.tsx") || route.endsWith("plant-market-applications/page.tsx")) {
    assert.match(source, /ApplicationManagement/, `Application workflow must use the shared page component: ${route}`);
  } else if (route.endsWith("content-drafts/page.tsx")) {
    assert.match(source, /ContentDraftsClient/, "Content drafts must retain its interactive workflow component");
    assert.match(readFileSync("app/admin/content-drafts/ContentDraftsClient.tsx", "utf8"), /AdminPageLayout/, "Content drafts client must use AdminPage");
  } else if (route.endsWith("seo-pages/page.tsx")) {
    assert.match(source, /SeoPagesClient/, "SEO pages must retain its interactive workflow component");
    assert.match(readFileSync("app/admin/seo-pages/seo-pages-client.tsx", "utf8"), /AdminPageLayout/, "SEO pages client must use AdminPage");
  } else {
    assert.match(source, /AdminPageLayout/, `Admin route must adopt the shared AdminPage primitive: ${route}`);
  }
}

const shell = readFileSync("components/admin/shell/AdminShell.tsx", "utf8");
const requiredNavigation = [
  "/admin", "/admin/command-center", "/admin/products", "/admin/categories",
  "/admin/seed-information", "/admin/orders", "/admin/harvest",
  "/admin/plant-market-products", "/admin/plant-market-applications", "/admin/green-exchange", "/admin/custom-orders",
  "/admin/users", "/admin/identity-verification", "/admin/seller-applications",
  "/admin/transport", "/admin/jobs", "/admin/finance", "/admin/reports",
  "/admin/articles", "/admin/content-studio", "/admin/ai-content",
  "/admin/content-drafts", "/admin/growth-intelligence", "/admin/seo",
  "/admin/seo-pages", "/admin/search-intelligence",
  "/admin/search-intelligence/opportunities", "/admin/opportunities",
  "/admin/access-control", "/admin/audit", "/admin/settings",
];
for (const href of requiredNavigation) assert.ok(shell.includes(`href: "${href}"`), `Admin navigation entry missing: ${href}`);

assert.match(shell, /event\.metaKey\s*\|\|\s*event\.ctrlKey/, "Command palette must support Mac and Windows/Linux shortcuts");
assert.match(shell, /event\.key\.toLowerCase\(\)\s*===\s*"k"/, "Command palette must open on Ctrl/Cmd+K");
assert.match(shell, /role="dialog"\s+aria-modal="true"/, "Command palette must expose an accessible modal dialog");
assert.match(shell, /event\.key\s*===\s*"Escape"/, "Command palette must close on Escape");
assert.doesNotMatch(shell, /href:\s*"\/super-admin"/, "Admin navigation must not expose an unverified external module route");

const layout = readFileSync("app/admin/layout.tsx", "utf8");
assert.match(layout, /admin-design-system\.css/, "All protected Admin pages must load the shared design system");
const styles = readFileSync("components/admin/ui/admin-design-system.css", "utf8");
assert.match(styles, /\.admin-workspace/, "All protected Admin pages must inherit the workspace foundation");
console.log(`Admin Control Center navigation regression passed: ${pageRoutes.length} page routes inventoried, ${requiredNavigation.length} navigation destinations checked, keyboard command palette and shared workspace verified.`);
