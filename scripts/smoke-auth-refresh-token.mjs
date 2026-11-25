#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const proxy = readFileSync("proxy.ts", "utf8");
assert.match(proxy, /export async function proxy\\(/, "Next.js 16 must invoke the proxy convention");
assert.match(proxy, /supabase\.auth\.getUser\(\)/, "proxy must continue refreshing the user session");
assert.match(proxy, /refresh_token_not_found/, "known missing refresh-token errors must be recognized");
assert.match(proxy, /invalid_refresh_token/, "invalid refresh-token errors must be recognized");
assert.match(proxy, /Invalid Refresh Token|invalid refresh token/i, "provider error messages must be recognized");
assert.match(proxy, /cookie\.name\.startsWith\("sb-"\)/, "only Supabase auth cookies may be cleared");
assert.match(proxy, /request\.cookies\.delete\(name\)/, "cleared cookies must be removed from the request view");
assert.match(proxy, /response\.cookies\.delete\(name\)/, "cleared cookies must be expired in the response");
assert.match(proxy, /NextResponse\.next\(\{ request \}\)/, "downstream Server Components must receive the cleaned request cookie view");
assert.match(proxy, /Cache-Control", "private, no-store/, "auth cookie responses must not be cached by a CDN");
assert.match(proxy, /Pragma", "no-cache/, "auth cookie responses must include legacy no-cache protection");
assert.doesNotMatch(proxy, /request\.cookies\.delete\([^)]*\*|response\.cookies\.delete\([^)]*\*/, "cookie clearing must not use broad wildcard deletion");

console.log("Invalid Supabase refresh-token and auth response cache regression checks passed.");
