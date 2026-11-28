#!/usr/bin/env node
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";

const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
for (const [name, value] of Object.entries({ baseUrl, anonKey, serviceKey })) {
  assert.ok(value, `${name} must be provided by the isolated local Supabase stack`);
}

async function request(path, { method = "GET", key = anonKey, token = key, body, rawBody, contentType, headers = {} } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      ...(body === undefined && rawBody === undefined ? {} : { "Content-Type": contentType || "application/json" }),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : rawBody !== undefined ? { body: rawBody } : {}),
  });
  const text = await response.text();
  let data = text;
  try { data = text ? JSON.parse(text) : null; } catch {}
  return { response, data, text };
}

async function createUser(label, role, fullName) {
  const email = `agriva-plant-review-${label}-${randomUUID()}@example.test`;
  const password = `Local-Plant-Review-${randomUUID()}!aA9`;
  const created = await request("/auth/v1/admin/users", {
    method: "POST", key: serviceKey, token: serviceKey,
    body: { email, password, email_confirm: true },
  });
  assert.ok([200, 201].includes(created.response.status), `Could not create ${label} Auth user: ${created.text}`);
  const id = created.data?.id;
  assert.match(id || "", /^[0-9a-f-]{36}$/i, "Auth did not return a user UUID");

  const profile = await request("/rest/v1/profiles", {
    method: "POST", key: serviceKey, token: serviceKey,
    headers: { Prefer: "return=minimal" },
    body: { id, role, full_name: fullName },
  });
  assert.equal(profile.response.status, 201, `Could not create ${label} profile: ${profile.text}`);

  const signedIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST", body: { email, password },
  });
  assert.equal(signedIn.response.status, 200, `Could not sign in ${label}: ${signedIn.text}`);
  return { id, email, password, token: signedIn.data.access_token };
}

async function submitPlantApplication(user, { category, nurseryName, nurseryAddress }) {
  const objectPath = `${user.id}/${randomUUID()}.pdf`;
  const uploaded = await request(`/storage/v1/object/identity-verification/${objectPath}`, {
    method: "POST", key: serviceKey, token: serviceKey,
    rawBody: Buffer.from("%PDF-1.4\nAGRIVA synthetic private seller evidence\n%%EOF\n"),
    contentType: "application/pdf",
    headers: { "x-upsert": "false" },
  });
  assert.ok([200, 201].includes(uploaded.response.status), `Could not upload synthetic private evidence: ${uploaded.text}`);

  const now = new Date().toISOString();
  const submitted = await request("/rest/v1/module_access_applications?select=id,user_id,module,status", {
    method: "POST", token: user.token,
    headers: { Prefer: "return=representation" },
    body: {
      user_id: user.id,
      module: "plant_market",
      applicant_type: "gardener",
      status: "pending",
      applicant_data: {
        schema_version: 1,
        seller_category: category,
        contact_name: user.fullName,
        contact_phone: "01700000000",
        district: "Dinajpur",
        gardening_types: ["fruit_saplings", "outdoor"],
        experience_note: "Synthetic CI applicant grows and sells healthy plants and fruit saplings.",
        operating_model: "own_grown",
        nursery_name: nurseryName,
        nursery_address: nurseryAddress,
        source_declaration: "Plants are grown in our own nursery using verified seeds and cuttings.",
        delivery_coverage: "Dinajpur and nearby districts",
        policy_accepted: true,
        policy_version: "seller-v1",
        policy_accepted_at: now,
        evidence_paths: [objectPath],
        evidence_types: ["nursery_photos"],
      },
    },
  });
  assert.equal(submitted.response.status, 201, `Plant Market seller application insert failed: ${submitted.text}`);
  const application = submitted.data?.[0];
  assert.ok(application?.id, "Plant Market application did not return an id");
  assert.equal(application.status, "pending");
  return { id: application.id, userId: user.id, evidencePath: objectPath };
}

const admin = await createUser("admin", "admin", "Synthetic Plant Market Admin");
const nursery = await createUser("nursery", "user", "Synthetic Nursery Owner");
nursery.fullName = "Synthetic Nursery Owner";
const grower = await createUser("grower", "user", "Synthetic Plant Grower");
grower.fullName = "Synthetic Plant Grower";

const nurseryApplication = await submitPlantApplication(nursery, {
  category: "nursery_owner",
  nurseryName: "Synthetic Green Nursery",
  nurseryAddress: "Dinajpur Sadar, Dinajpur",
});
const growerApplication = await submitPlantApplication(grower, {
  category: "plant_grower",
  nurseryName: null,
  nurseryAddress: null,
});

const history = await request(`/rest/v1/module_access_application_events?select=application_id,event_type&application_id=in.(${nurseryApplication.id},${growerApplication.id})`, {
  key: serviceKey, token: serviceKey,
});
assert.equal(history.response.status, 200, `Could not inspect application submission events: ${history.text}`);
assert.equal(history.data.filter((event) => event.event_type === "submitted").length, 2, "Each seller submission must create a lifecycle event");

if (process.env.GITHUB_ENV) {
  process.stdout.write("::add-mask::" + admin.password + "\n");
  await appendFile(process.env.GITHUB_ENV, [
    `AGRIVA_QA_ADMIN_EMAIL=${admin.email}`,
    `AGRIVA_QA_ADMIN_PASSWORD=${admin.password}`,
    `AGRIVA_QA_ADMIN_USER_ID=${admin.id}`,
    `AGRIVA_QA_PLANT_NURSERY_APP_ID=${nurseryApplication.id}`,
    `AGRIVA_QA_PLANT_NURSERY_USER_ID=${nurseryApplication.userId}`,
    `AGRIVA_QA_PLANT_GROWER_APP_ID=${growerApplication.id}`,
    `AGRIVA_QA_PLANT_GROWER_USER_ID=${growerApplication.userId}`,
    "",
  ].join("\n"));
}

console.log(JSON.stringify({
  status: "passed",
  adminUserCreated: true,
  syntheticSellerApplications: [
    { id: nurseryApplication.id, category: "nursery_owner", privateEvidenceUploaded: true },
    { id: growerApplication.id, category: "plant_grower", privateEvidenceUploaded: true },
  ],
  submissionEvents: history.data.length,
}, null, 2));
