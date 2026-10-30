#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const middleware = readFileSync("middleware.ts", "utf8");
assert.match(middleware, /supabase\.auth\.getUser\(\)/, "middleware must continue refreshing the user session");
assert.match(middleware, /refresh_token_not_found/, "known missing refresh-token errors must be recognized");
assert.match(middleware, /invalid_refresh_token/, "invalid refresh-token errors must be recognized");
assert.match(middleware, /Invalid Refresh Token|invalid refresh token/i, "provider error messages must be recognized");
assert.match(middleware, /cookie\.name\.startsWith\("sb-"\)/, "only Supabase auth cookies may be cleared");
assert.match(middleware, /request\.cookies\.delete\(cookie\.name\)/, "cleared cookies must be removed from the request view");
assert.match(middleware, /response\.cookies\.delete\(cookie\.name\)/, "cleared cookies must be expired in the response");
assert.doesNotMatch(middleware, /request\.cookies\.delete\([^)]*\*|response\.cookies\.delete\([^)]*\*/, "cookie clearing must not use broad wildcard deletion");

console.log("Invalid Supabase refresh-token cookie regression checks passed.");
