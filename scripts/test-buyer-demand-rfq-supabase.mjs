import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";

const unwrap = (value) => value?.replace(/^(['"])(.*)\1$/s, "$2");
const baseUrl = unwrap(process.env.SUPABASE_URL);
const anonKey = unwrap(process.env.SUPABASE_ANON_KEY);
const serviceRoleKey = unwrap(process.env.SUPABASE_SERVICE_ROLE_KEY);

for (const [name, value] of Object.entries({ baseUrl, anonKey, serviceRoleKey })) {
  assert.ok(value, `${name} must be set by supabase status`);
}

const apiUrl = baseUrl.replace(/\/$/, "");
const demandId = randomUUID();
const password = `Local-Integration-${randomUUID()}!aA9`;

async function request(path, { method = "GET", key = anonKey, token = key, body, headers = {} } = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data = text;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { response, data, text };
}

async function createAuthenticatedUser(label) {
  const email = `agriva-${label}-${randomUUID()}@example.test`;
  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    key: serviceRoleKey,
    token: serviceRoleKey,
    body: { email, password, email_confirm: true },
  });
  assert.ok([200, 201].includes(created.response.status), `Auth admin create failed: ${created.text}`);
  assert.ok(created.data?.id, "Auth did not return a user id");

  const signedIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password },
  });
  assert.equal(signedIn.response.status, 200, `Password sign-in failed: ${signedIn.text}`);
  assert.ok(signedIn.data?.access_token, "Auth did not return an access token");

  const identity = await request("/auth/v1/user", {
    key: anonKey,
    token: signedIn.data.access_token,
  });
  assert.equal(identity.response.status, 200, `Auth user endpoint failed: ${identity.text}`);
  assert.equal(identity.data.id, created.data.id, "Auth token identity mismatch");

  return { id: created.data.id, token: signedIn.data.access_token, email };
}

async function waitForPostgrestSchema() {
  let last;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    last = await request("/rest/v1/buyer_demands?select=crop_name&limit=0");
    if (last.response.status === 200) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`PostgREST did not load the buyer_demands schema: ${last?.response.status} ${last?.text}`);
}

async function expectDenied(path, { token = anonKey, key = anonKey, method = "GET", body } = {}) {
  const result = await request(path, { method, key, token, body });
  assert.ok(
    result.response.status === 401 || result.response.status === 403 || result.response.status === 400,
    `Expected permission denial for ${path}; received ${result.response.status}: ${result.text}`,
  );
  return result;
}

await waitForPostgrestSchema();

const buyer = await createAuthenticatedUser("buyer");
const otherBuyer = await createAuthenticatedUser("other");
const admin = await createAuthenticatedUser("admin");
const profile = await request("/rest/v1/profiles", {
  method: "POST",
  key: serviceRoleKey,
  token: serviceRoleKey,
  headers: { Prefer: "return=representation" },
  body: { id: admin.id, role: "admin", full_name: "Synthetic CI Admin" },
});
assert.equal(profile.response.status, 201, `Could not create synthetic admin profile: ${profile.text}`);
if (process.env.GITHUB_ENV) {
  process.stdout.write("::add-mask::" + password + "\n");
  await appendFile(process.env.GITHUB_ENV, "AGRIVA_QA_ADMIN_EMAIL=" + admin.email + "\nAGRIVA_QA_ADMIN_PASSWORD=" + password + "\n");
}

const inserted = await request("/rest/v1/buyer_demands?select=id", {
  method: "POST",
  key: serviceRoleKey,
  token: serviceRoleKey,
  headers: { Prefer: "return=representation" },
  body: {
    id: demandId,
    buyer_id: buyer.id,
    crop_name: "ধান",
    quantity: 120,
    unit: "kg",
    district: "Dinajpur",
    upazila: "Birampur",
    need_mode: "flexible",
    response_deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    notes: "PRIVATE_NOTE_MUST_NOT_COPY",
    contact_phone: "01700000000",
    target_price: 45,
    status: "active",
  },
});
assert.equal(inserted.response.status, 201, `Could not create synthetic demand: ${inserted.text}`);

const publicCrop = await request(`/rest/v1/buyer_demands?select=crop_name&id=eq.${demandId}`);
assert.equal(publicCrop.response.status, 200, `Anonymous PostgREST read failed: ${publicCrop.text}`);
assert.equal(publicCrop.data?.[0]?.crop_name, "ধান");

await expectDenied(`/rest/v1/buyer_demands?select=contact_phone&id=eq.${demandId}`);
const privateCrop = await request(`/rest/v1/buyer_demands?select=crop_name&id=eq.${demandId}`, {
  token: buyer.token,
});
assert.equal(privateCrop.response.status, 200, `Authenticated PostgREST read failed: ${privateCrop.text}`);
await expectDenied(`/rest/v1/buyer_demands?select=contact_phone&id=eq.${demandId}`, {
  token: buyer.token,
});

const rpcPath = "/rest/v1/rpc/convert_buyer_demand_to_bulk_rfq";
const rpcBody = {
  p_demand_id: demandId,
  p_buyer_type: "individual",
  p_visibility: "private",
  p_quote_deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
};
await expectDenied(rpcPath, { method: "POST", body: rpcBody });

const converted = await request(rpcPath, {
  method: "POST",
  token: buyer.token,
  body: rpcBody,
});
assert.equal(converted.response.status, 200, `Authenticated RFQ RPC failed: ${converted.text}`);
const requestId = converted.data;
assert.match(requestId, /^[0-9a-f-]{36}$/i, "RFQ RPC did not return a UUID");

const retried = await request(rpcPath, {
  method: "POST",
  token: buyer.token,
  body: { ...rpcBody, p_quote_deadline: new Date(Date.now() + 8 * 86400000).toISOString() },
});
assert.equal(retried.response.status, 200, `Idempotent retry failed: ${retried.text}`);
assert.equal(retried.data, requestId, "Idempotent retry created a second RFQ");

await expectDenied(rpcPath, {
  method: "POST",
  token: otherBuyer.token,
  body: rpcBody,
});

const rfq = await request(
  `/rest/v1/bulk_requests?select=id,status,visibility,product_name,quantity,unit,district,upazila,specification&id=eq.${requestId}`,
  { key: serviceRoleKey, token: serviceRoleKey },
);
assert.equal(rfq.response.status, 200, `Could not verify created RFQ: ${rfq.text}`);
assert.equal(rfq.data?.length, 1);
assert.equal(rfq.data[0].status, "pending_review");
assert.equal(rfq.data[0].visibility, "private");
assert.equal(rfq.data[0].product_name, "ধান");
assert.equal(Number(rfq.data[0].quantity), 120);
assert.equal(rfq.data[0].specification, "", "Private free-text notes were copied into the RFQ");

const source = await request(
  `/rest/v1/buyer_demands?select=id,status,contact_phone&id=eq.${demandId}`,
  { key: serviceRoleKey, token: serviceRoleKey },
);
assert.equal(source.response.status, 200, `Could not verify source demand: ${source.text}`);
assert.equal(source.data?.[0]?.status, "active", "Source demand must remain active");
assert.equal(source.data?.[0]?.contact_phone, "01700000000", "Service role fixture phone mismatch");

console.log("Real Supabase Auth + PostgREST integration passed: sign-in, JWT identity, public allowlist, phone denial, authenticated RPC, ownership, idempotency and RFQ field mapping.");
