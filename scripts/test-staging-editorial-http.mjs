import { strict as assert } from "node:assert";

const base = process.env.STAGING_BASE_URL;
assert.ok(base, "STAGING_BASE_URL is required");
const origin = new URL(base);
assert.equal(origin.protocol, "https:", "HTTPS staging URL required");
assert.ok(origin.hostname.endsWith(".vercel.app"), "Use a staging Vercel deployment, not production");
const articleId = process.env.STAGING_TEST_ARTICLE_ID;
const adminCookie = process.env.STAGING_ADMIN_COOKIE;
const nonadminCookie = process.env.STAGING_NONADMIN_COOKIE;
const full = process.env.STAGING_FULL_HTTP_TEST === "true";
const endpoint = articleId
  ? new URL(`/api/admin/articles/${encodeURIComponent(articleId)}/editor`, origin)
  : new URL("/api/admin/articles/00000000-0000-4000-8000-000000000001/editor", origin);

async function request(cookie, payload) {
  const headers = { "content-type": "application/json" };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(endpoint, {
    method: "PATCH", headers, body: JSON.stringify(payload),
    redirect: "manual", signal: AbortSignal.timeout(20000),
  });
  const body = await response.text();
  return { status: response.status, body };
}
function expectStatus(label, result, expected) {
  assert.equal(result.status, expected, `${label}: expected ${expected}, got ${result.status}; body=${result.body.slice(0, 300)}`);
  console.log(`PASS ${label}: HTTP ${expected}`);
}

expectStatus("anonymous denied", await request(null, {}), 401);
if (!full) {
  console.log("Anonymous-only mode. Full 403/409 tests NOT executed.");
  process.exit(0);
}
assert.ok(adminCookie && nonadminCookie && articleId, "Full tests require STAGING_ADMIN_COOKIE, STAGING_NONADMIN_COOKIE, STAGING_TEST_ARTICLE_ID");
assert.match(articleId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
for (const cookie of [adminCookie, nonadminCookie]) {
  assert.ok(!/[\r\n]/.test(cookie), "Invalid cookie header");
}
expectStatus("non-admin denied", await request(nonadminCookie, {}), 403);
expectStatus("admin version precondition", await request(adminCookie, {}), 428);
const conflict = await request(adminCookie, { expectedVersion: 9007199254740991, nextStatus: "draft" });
expectStatus("admin stale version", conflict, 409);
assert.equal(JSON.parse(conflict.body).code, "EDITORIAL_CONFLICT");
console.log("Full read-only authorization and stale-version HTTP checks passed.");
