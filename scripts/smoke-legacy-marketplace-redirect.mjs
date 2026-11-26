import assert from "node:assert/strict";
import nextConfig from "../next.config.mjs";

const redirects = await nextConfig.redirects();
const legacy = redirects.find((rule) => rule.source === "/marketplace/agriva-black-rice-seed-ab21bee5");

assert.ok(legacy, "legacy black-rice product slug must have a redirect");
assert.equal(legacy.destination, "/marketplace/black-rice-seeds");
assert.equal(legacy.permanent, true, "redirect must be permanent (301/308)");
console.log("Legacy black-rice product redirect smoke test passed.");
