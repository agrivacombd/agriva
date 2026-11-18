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

const serviceKey = settings.SERVICE_ROLE_KEY || settings.SECRET_KEY;
assert.ok(serviceKey, "Local service role key needed for isolated seller fixtures");
const service = createClient(url, serviceKey, {auth:{persistSession:false,autoRefreshToken:false}});
const createFixtureUser = async (email) => {
  const {data,error} = await service.auth.admin.createUser({
    email,password:"FixtureOnly_UseNoRealAccounts_123!",email_confirm:true,
  });
  assert.ifError(error);
  assert.ok(data.user?.id);
  const c = newBuyer();
  const signed = await c.auth.signInWithPassword({email,password:"FixtureOnly_UseNoRealAccounts_123!"});
  assert.ifError(signed.error);
  return {id:data.user.id,client:c};
};
// All fixture identities, products and orders exist solely in the disposable local stack.
const seller=await createFixtureUser("fixture-seller@local.test");
const admin=await createFixtureUser("fixture-admin@local.test");
const updatedAdmin=await service.from("profiles").update({role:"admin"}).eq("id",admin.id);
assert.ifError(updatedAdmin.error);
const gardener=await service.from("gardener_profiles").insert({user_id:seller.id,verification_status:"verified"});
assert.ifError(gardener.error);
const grant=await service.from("user_module_grants").insert({
  user_id:seller.id,module:"plant_market",permission:"create",
  scope_type:"global",status:"active",
});
assert.ifError(grant.error);
const productDraft=await seller.client.from("plant_market_products").insert({
  seller_id:seller.id,name:"CI guest checkout test plant",slug:"ci-guest-checkout-test-plant",
  category:"Plants",category_slug:"plants",price:120,stock:5,unit:"piece",status:"draft",
}).select("id,status").single();
assert.ifError(productDraft.error);
assert.equal(productDraft.data.status,"draft");
const productId=productDraft.data.id;
const published=await admin.client.from("plant_market_products").update({status:"active"}).eq("id",productId).select("status").single();
assert.ifError(published.error);
assert.equal(published.data.status,"active");
const cod=await service.from("site_settings").upsert({key:"cod_enabled",value:"true"},{onConflict:"key"});
assert.ifError(cod.error);

const added=await a.rpc("plant_market_add_to_cart",{p_product_id:productId,p_quantity:2});
assert.ifError(added.error);
const shipping={fullName:"Local Test Buyer",phone:"+8801712345678",division:"Dhaka",
district:"Dhaka",upazila:"Dhanmondi",unionOrArea:"Ward",villageRoadHouse:"Test Road"};
const key="local-guest-checkout-order-0001";
const checkout=await a.rpc("plant_market_finalize_checkout",{p_shipping_address:shipping,p_idempotency_key:key});
assert.ifError(checkout.error);
assert.equal(checkout.data.replayed,false);
assert.equal(Number(checkout.data.total),240);
assert.equal(checkout.data.orderIds.length,1);
const repeat=await a.rpc("plant_market_finalize_checkout",{p_shipping_address:shipping,p_idempotency_key:key});
assert.ifError(repeat.error);
assert.equal(repeat.data.replayed,true);
assert.equal(repeat.data.checkoutId,checkout.data.checkoutId);
const aOrders=await a.from("plant_market_orders").select("id,buyer_id,total_amount,checkout_id").eq("checkout_id",checkout.data.checkoutId);
assert.ifError(aOrders.error);
assert.equal(aOrders.data.length,1);
assert.equal(aOrders.data[0].buyer_id,aId);
const bOrders=await b.from("plant_market_orders").select("id").eq("checkout_id",checkout.data.checkoutId);
assert.ifError(bOrders.error);
assert.equal(bOrders.data.length,0,"Other guest cannot view completed order");
const productAfter=await service.from("plant_market_products").select("stock").eq("id",productId).single();
assert.ifError(productAfter.error);
assert.equal(Number(productAfter.data.stock),3,"One order only should reduce stock from 5 to 3");
console.log("PASS: local Plant Market guest COD success, order visibility, idempotent replay, stock decrement and seller verification");

console.log("LIMITATION: Marketplace successful purchase and browser/UI E2E are separate release gates.");
