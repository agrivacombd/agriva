#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const page = readFileSync("app/admin/demand-intelligence/page.tsx", "utf8");
const shell = readFileSync("components/admin/shell/AdminShell.tsx", "utf8");
assert.match(page, /requireAdminPage\("dashboard\.read"\)/);
assert.match(page, /from\("bulk_requests"\)/);
assert.match(page, /from\("bulk_quotes"\)/);
assert.match(page, /from\("bulk_wholesalers"\)/);
assert.match(page, /read-only/);
assert.match(page, /quoteByRequest/);
assert.match(page, /buyer phone numbers/);
assert.match(shell, /Demand & RFQ/);
assert.match(shell, /\/admin\/demand-intelligence/);
console.log("AGRIVA Admin demand intelligence regression checks passed.");
