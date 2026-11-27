import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const route = read("../app/api/buyer-demands/convert-to-rfq/route.ts");
const ui = read("../components/marketplace/BuyerDemandRfqConversion.tsx");
const board = read("../components/marketplace/BuyerDemandBoard.tsx");

assert.match(route, /createSupabaseServerClient/);
assert.match(route, /supabase\.auth\.getUser\(\)/);
assert.match(route, /origin !== request\.nextUrl\.origin/);
assert.match(route, /MAX_BODY_BYTES = 2048/);
assert.match(route, /content-length/);
assert.match(route, /request\.body\.getReader\(\)/);
assert.match(route, /totalBytes > MAX_BODY_BYTES/);
assert.match(route, /reader\.cancel\(\)/);
assert.match(route, /rawBody === null/);
assert.doesNotMatch(route, /request\.text\(\)/);
assert.match(route, /application\/json/);
assert.match(route, /UUID\.test\(body\.demandId/);
assert.match(route, /BUYER_TYPES\.has\(body\.buyerType\)/);
assert.match(route, /VISIBILITIES\.has\(body\.visibility\)/);
assert.match(route, /MAX_DEADLINE_MS/);
assert.match(route, /convert_buyer_demand_to_bulk_rfq/);
assert.match(route, /p_demand_id: body\.demandId/);
assert.match(route, /p_buyer_type: body\.buyerType/);
assert.match(route, /p_visibility: body\.visibility/);
assert.match(route, /p_quote_deadline: new Date\(deadline\)\.toISOString\(\)/);
assert.doesNotMatch(route, /SERVICE_ROLE|service_role|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(ui, /buyerType/);
assert.match(ui, /visibility/);
assert.match(ui, /quoteDeadline/);
assert.match(ui, /type="datetime-local"/);
assert.match(ui, /required checked={confirmed}/);
assert.match(ui, /review queue-তে পাঠানো হয়েছে/);
assert.match(ui, /ফোন নম্বর, ব্যক্তিগত নোট, target price ও কৃষকদের আগ্রহ\/প্রস্তাব RFQ-তে কপি হবে না/);
assert.match(ui, /fetch\("\/api\/buyer-demands\/convert-to-rfq"/);

assert.match(board, /import BuyerDemandRfqConversion/);
assert.match(board, /own && d\.status === "active" && <BuyerDemandRfqConversion/);
assert.match(board, /demandId={d\.id}/);

console.log("Buyer demand RFQ review UI and authenticated API regression passed.");
