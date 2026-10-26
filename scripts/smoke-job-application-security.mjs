#!/usr/bin/env node

/**
 * Static regression check for Jobs application target binding.
 * No network access, database credentials, or test applications are used.
 */
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const action = readFileSync("app/jobs/[slug]/apply/actions.ts", "utf8");
const page = readFileSync("app/jobs/[slug]/apply/page.tsx", "utf8");

assert.match(action, /applyToJob\(slug: string, formData: FormData\)/, "server action must receive the bound route slug");
assert.match(action, /\.eq\("slug", safeSlug\)/, "server action must resolve the job by the bound slug");
assert.match(action, /\.eq\("status", "published"\)/, "server action must require a published job");
assert.match(action, /application_deadline[\s\S]*?Date\.now\(\)/, "server action must check the application deadline");
assert.match(action, /job_id: job\.id/, "insert must use the server-resolved job ID");
assert.doesNotMatch(action, /formData\.get\(["']job_id["']\)/, "server action must not trust submitted job_id");
assert.match(page, /action=\{applyToJob\.bind\(null, job\.slug\)\}/, "form must bind the rendered job slug");
assert.doesNotMatch(page, /name=["']job_id["']/, "form must not submit a hidden job_id");
assert.doesNotMatch(page, /name=["']slug["']/, "form must not submit a client-controlled slug");

console.log("Jobs application server-binding regression checks passed.");
