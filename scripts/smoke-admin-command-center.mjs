#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
const page = readFileSync("app/admin/command-center/page.tsx", "utf8");
const shell = readFileSync("components/admin/shell/AdminShell.tsx", "utf8");
assert.match(page, /requireAdminPage\("dashboard\.read"\)/);
assert.match(page, /module_access_applications/);
assert.match(page, /application_type/);
assert.match(page, /—/);
assert.match(page, /Live platform snapshot/);
assert.match(page, /Read-only overview/);
assert.match(page, /marketplace_orders/);
assert.match(shell, /Command Center/);
assert.match(shell, /\/admin\/command-center/);
console.log("AGRIVA Admin 2.0 command center regression checks passed.");
