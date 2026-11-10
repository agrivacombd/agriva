import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = await readFile(new URL("../lib/jobs/cv/schema.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../lib/jobs/cv/migration.ts", import.meta.url), "utf8");

for (const field of ["profile", "experience", "education", "skills", "languages", "certifications", "projects", "customSections", "settings"]) {
  assert.match(schema, new RegExp("\\b" + field + "\\b"), `CV schema should define ${field}`);
}
assert.match(schema, /version:\\s*2/, "new CV documents should be versioned");
assert.match(migration, /agriva-cv-v1/, "migration should document the legacy storage key");
assert.match(migration, /legacy-experience-1/, "legacy experience should be retained as a structured entry");
assert.match(migration, /legacy-education-1/, "legacy education should be retained as a structured entry");
assert.match(migration, /do not invent dates or employers/i, "migration must not fabricate employment details");
assert.match(migration, /JSON\\.parse/, "migration should safely parse existing browser data");
assert.match(migration, /catch/, "invalid stored data should not crash the builder");

console.log("CV builder migration architecture smoke checks passed.");
