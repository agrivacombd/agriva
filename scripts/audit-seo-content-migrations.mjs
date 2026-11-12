#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { readdirSync, readFileSync } from "node:fs";
const dir = "supabase/migrations";
const files = readdirSync(dir).filter(f => f.endsWith(".sql")).sort();
const content = files.map(file => ({ file, sql: readFileSync(`${dir}/${file}`, "utf8") }));
const related = content.filter(({ file, sql }) => /content_draft|content_opportunit|search_quer|search_opportunit|seo_landing|seo_engine|track_search|learning_correction|seed_information/i.test(file + " " + sql));
const versions = new Map();
for (const { file } of content) {
  const version = file.match(/^(\d+)_/)?.[1];
  if (!version) continue;
  versions.set(version, [...(versions.get(version) || []), file]);
}
const duplicates = [...versions.entries()].filter(([, names]) => names.length > 1);
const find = name => {
  const item = content.find(x => x.file === name);
  assert.ok(item, `Missing required migration: ${name}`);
  return item.sql;
};
const canonical = find("007_search_opportunity_canonical.sql");
assert.match(canonical, /create table if not exists public\.content_opportunities/i);
assert.match(canonical, /enable row level security/i);
const drafts = find("008_content_drafts.sql");
assert.match(drafts, /enable row level security/i);
assert.match(drafts, /content_drafts_admin_all/i);
const workflow = find("20261025200000_allow_content_unpublish_to_review.sql");
assert.match(workflow, /OLD\.status = 'published' AND NEW\.status = 'review'/);
const revision = find("20261025210000_content_draft_revision_history.sql");
assert.match(revision, /enable row level security/i);
assert.match(revision, /REVOKE ALL ON TABLE public\.content_draft_revisions FROM authenticated/i);
const publicRead = find("20261105183411_harden_public_content_drafts_read.sql");
assert.match(publicRead, /status = 'published' AND content_type = 'article'/);
assert.match(publicRead, /GRANT SELECT \(/);
const seoLanding = find("20261105183331_seo_landing_pages.sql");
assert.match(seoLanding, /enable row level security/i);
assert.match(seoLanding, /status = 'published'/);
const repair = find("20261112210000_repair_content_draft_workflow.sql");
assert.match(repair, /CREATE TABLE IF NOT EXISTS public\.content_draft_revisions/i);
assert.match(repair, /CREATE TRIGGER content_drafts_workflow_guard/i);
assert.match(repair, /CREATE TRIGGER content_draft_revision_capture/i);
assert.match(repair, /REVOKE ALL ON TABLE public\.content_draft_revisions FROM PUBLIC, anon, authenticated/i);
assert.match(repair, /OLD\.status = 'published' AND NEW\.status = 'review'/);
const engine = find("20261112200000_seo_engine_foundation.sql");
assert.match(engine, /enable row level security/gi);
assert.match(engine, /revoke all on public\.seo_engine_jobs, public\.seo_engine_usage from anon/i);
assert.doesNotMatch(engine, /create policy[^;]+for insert to anon/is);
const maxOtherTimestamp = files.filter(f => /^20\d{12}_/.test(f) && !f.includes("seo_engine_foundation") && !f.includes("repair_content_draft_workflow"))
  .map(f => f.slice(0, 14)).sort().at(-1);
assert.ok("20261112210000" > maxOtherTimestamp, "Repair migration must follow existing timestamped migrations");
console.log(JSON.stringify({
  migrationCount: files.length,
  contentRelatedCount: related.length,
  contentRelatedMigrations: related.map(x => x.file),
  duplicateVersions: duplicates.map(([version, names]) => ({ version, files: names })),
  checks: "passed",
}, null, 2));
// Historical duplicate versions are reported, not hidden. They require a separate
// migration-history reconciliation before production deployment.
