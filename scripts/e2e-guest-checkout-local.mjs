#!/usr/bin/env node
// Uses only a freshly started local Supabase stack. Never connect to production.
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const envFile = process.env.SUPABASE_LOCAL_ENV_FILE || "/tmp/agriva-supabase-local.env";
const settings = Object.fromEntries(readFileSync(envFile,"utf8").split(/\r?\n/).filter(Boolean).map(line => {
  const i = line.indexOf("=");
  return [line.slice(0,i), line.slice(i+1).replace(/^['"]|['"]$/g,"")];
}));
const url = settings.API_URL || settings.SUPABASE_URL;
const anonKey = settings.ANON_KEY || settings.PUBLISHABLE_KEY;
assert.ok(url && (url.includes("127.0.0.1") || url.includes("localhost")), "Refusing non-local Supabase URL");
assert.ok(anonKey, "Supabase local API key is required");
const newBuyer = () => createClient(url, anonKey, {auth:{persistSession:false,autoRefreshToken:false}});
const a = newBuyer(), b = newBuyer();
const aSign = await a.auth.signInAnonymously();
const bSign = await b.auth.signInAnonymously();
assert.ifError(aSign.error);
assert.ifError(bSign.error);
const aId = aSign.data.user?.id, bId = bSign.data.user?.id;
assert.ok(aId && bId && aId !== bId, "Two guests must have distinct identities");
const aVerify = await a.auth.getUser();
assert.ifError(aVerify.error);
assert.equal(aVerify.data.user?.id, aId, "Guest session must be verified");
assert.equal(aVerify.data.user?.is_anonymous, true, "Guest identity must remain anonymous");
const profile = await a.from("profiles").select("role,selected_roles").eq("id",aId).single();
assert.ifError(profile.error);
assert.equal(profile.data.role,"buyer");
assert.deepEqual(profile.data.selected_roles,["buyer"]);
const memberships = await a.from("user_role_memberships").select("role").eq("user_id",aId);
assert.ifError(memberships.error);
assert.deepEqual(memberships.data.map(r=>r.role),["buyer"]);
const elevation = await a.rpc("update_my_role_memberships",{p_roles:["admin","seller"]});
assert.ok(elevation.error, "Guests must not self-elevate");
for(const table of ["carts","cart_items","marketplace_checkouts","marketplace_orders",
   "plant_market_carts","plant_market_cart_items","plant_market_checkouts",
   "plant_market_orders","plant_market_order_items"]) {
  const seen = await b.from(table).select("*",{count:"exact",head:true});
  assert.ifError(seen.error);
  assert.equal(seen.count,0,"A new guest must not see another customer's "+table);
}
for(const [name, rpc, args] of [
  ["Marketplace cart checkout","finalize_marketplace_cart_checkout",{p_shipping_address:{},p_idempotency_key:"guest-e2e-empty-123456"}],
  ["Plant Market checkout","plant_market_finalize_checkout",{p_shipping_address:{},p_idempotency_key:"guest-e2e-empty-123456"}]
]) {
 const result = await a.rpc(rpc,args);
 assert.ok(result.error,name+" must refuse incomplete delivery info / empty cart");
}
console.log("PASS: real local anonymous sign-ins, buyer-only grants, forbidden escalation, RLS isolation, invalid checkout rejection");
console.log("LIMITATION: no seeded successful purchase or duplicate-order replay was performed.");
