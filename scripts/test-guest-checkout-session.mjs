#!/usr/bin/env node
// Isolated behavioral unit test for the browser-side guest session lifecycle.
// Uses a mocked Auth client; no Supabase project, orders or payments are touched.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const src = readFileSync(new URL("../lib/marketplace/guest-checkout-session.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function makeInitializer(client) {
  const exports = {};
  const localRequire = name => {
    assert.equal(name, "@/lib/supabase/browser");
    return { createSupabaseBrowserClient: () => client };
  };
  new Function("exports", "require", compiled)(exports, localRequire);
  return exports.ensureCheckoutBuyerSession;
}

{
  let signedIn = false;
  let creations = 0;
  let verifications = 0;
  const guest = { id: "guest-1", is_anonymous: true };
  const client = { auth: {
    getSession: async () => ({ data: { session: signedIn ? { user: guest } : null }, error: null }),
    signInAnonymously: async () => {
      creations++;
      await Promise.resolve();
      signedIn = true;
      return { error: null };
    },
    getUser: async () => { verifications++; return { data: { user: guest }, error: null }; },
  }};
  const ensure = makeInitializer(client);
  const results = await Promise.all([ensure(), ensure(), ensure()]);
  assert.equal(creations, 1, "Parallel guest requests must create only one anonymous identity");
  assert.equal(verifications, 1, "Parallel requests should share the same Auth verification");
  assert.ok(results.every(value => value.user.id === guest.id));
  await ensure();
  assert.equal(creations, 1, "Existing anonymous buyer must reuse the same Auth identity");
}

{
  let creations = 0;
  const customer = { id: "customer-1", is_anonymous: false };
  const client = { auth: {
    getSession: async () => ({ data: { session: { user: customer } }, error: null }),
    signInAnonymously: async () => { creations++; return { error: null }; },
    getUser: async () => ({ data: { user: customer }, error: null }),
  }};
  const result = await makeInitializer(client)();
  assert.equal(result.user.id, customer.id, "Existing customer session must be retained");
  assert.equal(creations, 0, "Registered customers must not be signed in anonymously");
}

{
  let attempts = 0;
  const guest = { id: "guest-retry", is_anonymous: true };
  const client = { auth: {
    getSession: async () => ({ data: { session: attempts > 1 ? { user: guest } : null }, error: null }),
    signInAnonymously: async () => {
      attempts++;
      return attempts === 1 ? { error: new Error("anonymous provider unavailable") } : { error: null };
    },
    getUser: async () => ({ data: { user: guest }, error: null }),
  }};
  const ensure = makeInitializer(client);
  await assert.rejects(ensure(), /অতিথি/);
  const result = await ensure();
  assert.equal(attempts, 2, "A rejected attempt must allow retry");
  assert.equal(result.user.id, guest.id);
}

console.log("Guest session concurrency, existing-account preservation and retry unit tests passed.");
