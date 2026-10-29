#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const route = readFileSync("app/api/farmer/products/route.ts", "utf8");

assert.match(route, /let body: unknown;/, "seller product request body must be treated as untrusted input");
assert.match(route, /if \(!body \|\| typeof body !== "object" \|\| Array\.isArray\(body\)\)/, "null, primitive, and array JSON payloads must return a client error instead of throwing");
assert.match(route, /const payload = body as Record<string, unknown>/, "only validated object payloads may be read as product fields");
assert.match(route, /typeof payload\.name === "string"/, "product name must be validated as a string");
assert.match(route, /typeof payload\.description === "string"/, "product description must be validated as a string");
assert.match(route, /invalidNumberInput\(rawPrice\) \|\| invalidNumberInput\(rawStock\)/, "null and empty price/stock values must not coerce to zero");
assert.doesNotMatch(route, /let body: any/, "unvalidated any-typed request bodies must not be used");

console.log("Seller product payload validation regression checks passed.");
