#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const reseller = readFileSync("app/api/reseller/links/route.ts", "utf8");
const cropDiseaseRoute = readFileSync("app/api/crop-disease/route.ts", "utf8");
const cropDiseaseMigration = readFileSync("supabase/migrations/017_crop_disease_detections.sql", "utf8");
const publicAiRoute = readFileSync("app/api/ai/route.ts", "utf8");
const publicSearchRoute = readFileSync("app/api/search/route.ts", "utf8");
const cropMultipartReader = readFileSync("app/api/crop-disease/route.ts", "utf8");
const sslIpnRoute = readFileSync("app/api/payment/sslcommerz/ipn/route.ts", "utf8");
const sslSuccessRoute = readFileSync("app/api/payment/sslcommerz/success/route.ts", "utf8");
const sslCancelRoute = readFileSync("app/api/payment/sslcommerz/cancel/route.ts", "utf8");
const sslFailRoute = readFileSync("app/api/payment/sslcommerz/fail/route.ts", "utf8");
const adminArticleRoute = readFileSync("app/api/admin/article/generate/route.ts", "utf8");
const contentBriefRoute = readFileSync("app/api/admin/content-brief/route.ts", "utf8");
const contentDraftRoute = readFileSync("app/api/admin/content-drafts/generate/route.ts", "utf8");
const contentOpportunityRoute = readFileSync("app/api/admin/content-opportunities/route.ts", "utf8");
const adminProductRoute = readFileSync("app/api/admin/products/route.ts", "utf8");
const resellerLinkRoute = readFileSync("app/api/reseller/links/route.ts", "utf8");
const publishDraftRoute = readFileSync("app/admin/content-drafts/publish/route.ts", "utf8");
const checkoutRoute = readFileSync("app/api/checkout/route.ts", "utf8");
const paymentInitRoute = readFileSync("app/api/payment/sslcommerz/init/route.ts", "utf8");
const requestBodyReader = readFileSync("lib/http/read-limited-request-body.ts", "utf8");
const contentPublishRoute = readFileSync("app/admin/content-drafts/publish/route.ts", "utf8");
const orderReportRoute = readFileSync("app/admin/reports/orders.csv/route.ts", "utf8");
const checkout = readFileSync("app/api/checkout/route.ts", "utf8");
assert.match(reseller, /authorizePermission\("reseller\.links\.create_own"\)/, "reseller links must use the capability guard and support role memberships");
assert.match(checkout, /authorizePermission\("orders\.create_own"\)/, "checkout must require the buyer order-creation capability");
assert.match(reseller, /UUID_PATTERN\.test\(productId\)/, "product ID must be validated as UUID");
assert.doesNotMatch(reseller, /error: error\.message/, "database details must not be exposed by reseller link API");
assert.match(publicAiRoute, /question\.length > 2000/, "public AI endpoint must bound prompt length");
assert.match(publicSearchRoute, /readRequestBodyWithLimit\(request, MAX_REQUEST_BYTES\)/, "public search endpoint must enforce a streamed request body limit");
assert.match(publicSearchRoute, /boundedBody\.ok[\s\S]*?status: 413/, "oversized public search request bodies must be rejected");
assert.match(requestBodyReader, /readRequestBytesWithLimit/, "binary request reader must be available for multipart uploads");
assert.match(cropMultipartReader, /readRequestBytesWithLimit\(request, MAX_REQUEST_BYTES\)/, "crop-disease must enforce actual streamed multipart size");
assert.match(cropMultipartReader, /new Response\(boundedBody\.bytes, \{ headers: request\.headers \}\)\.formData\(\)/, "crop-disease must parse multipart only after enforcing the byte limit");
assert.match(sslIpnRoute, /readRequestBytesWithLimit\(request, MAX_IPN_BODY_BYTES\)/, "SSLCommerz IPN must enforce a streamed form body limit");
assert.match(sslSuccessRoute, /readRequestBytesWithLimit\(request, 16 \* 1024\)/, "SSLCommerz success callback must enforce a streamed form body limit");
assert.match(sslCancelRoute, /readRequestBytesWithLimit\(request, 16 \* 1024\)/, "SSLCommerz cancellation callback must enforce a streamed form body limit");
assert.match(sslFailRoute, /readRequestBytesWithLimit\(request, 16 \* 1024\)/, "SSLCommerz failure callback must enforce a streamed form body limit");
assert.match(adminArticleRoute, /readRequestBodyWithLimit\(request, 32768\)/, "article generation must bound JSON request bodies");
assert.match(contentBriefRoute, /readRequestBodyWithLimit\(request, 16384\)/, "content brief must bound JSON request bodies");
assert.match(contentDraftRoute, /readRequestBodyWithLimit\(request, 32768\)/, "content draft generation must bound JSON request bodies");
assert.match(contentOpportunityRoute, /readRequestBodyWithLimit\(request, 16384\)/, "content opportunity mutations must bound JSON request bodies");
assert.match(adminProductRoute, /readRequestBodyWithLimit\(request, 32768\)/, "admin product creation must bound JSON request bodies");
assert.match(resellerLinkRoute, /readRequestBodyWithLimit\(request, 8192\)/, "reseller link creation must bound JSON request bodies");
assert.match(publishDraftRoute, /readRequestBodyWithLimit\(request, 8192\)/, "draft publishing must bound JSON request bodies");
assert.match(checkoutRoute, /readRequestBodyWithLimit\(request, 16384\)/, "checkout must bound JSON request bodies");
assert.match(paymentInitRoute, /readRequestBodyWithLimit\(request, 8192\)/, "payment initialization must bound JSON request bodies");
assert.match(publicAiRoute, /readRequestBodyWithLimit\(request, MAX_REQUEST_BYTES\)/, "public AI endpoint must enforce a streaming byte limit even without Content-Length");
assert.match(publicAiRoute, /boundedBody\.ok[\s\S]*?status: 413/, "oversized public AI request bodies must be rejected");
const limitedBodyReader = readFileSync("lib/http/read-limited-request-body.ts", "utf8");
assert.match(limitedBodyReader, /totalBytes > maxBytes/, "request body reader must enforce the actual streamed byte count");
assert.match(limitedBodyReader, /reader\.cancel\(/, "request body reader must cancel streams that exceed the limit");
assert.match(contentPublishRoute, /authorizePermission\("content\.publish"\)/, "content publishing route must require the publication capability");
assert.doesNotMatch(contentPublishRoute, /profile\?\.role !== "admin"/, "content publishing must not use a legacy single-profile admin check");
assert.match(orderReportRoute, /authorizePermission\("finance\.export_orders"\)/, "order export must require the dedicated finance export capability");
assert.doesNotMatch(orderReportRoute, /profile\?\.role !== "admin"/, "order export must not use a legacy single-profile admin check");
assert.match(orderReportRoute, /Cache-Control.*private, no-store/, "sensitive order exports must not be cached");
assert.match(cropDiseaseRoute, /supabase\.auth\.getUser\(\)/, "crop-disease history and uploads must require a verified session");
assert.match(cropDiseaseRoute, /MAX_REQUEST_BYTES = MAX_IMAGE_BYTES \+ 256 \* 1024/, "crop-disease multipart bodies must have a bounded overhead allowance");
assert.ok(cropDiseaseRoute.indexOf("request.headers.get(\"content-length\")") < cropDiseaseRoute.indexOf("readRequestBytesWithLimit(request, MAX_REQUEST_BYTES)") && cropDiseaseRoute.indexOf("readRequestBytesWithLimit(request, MAX_REQUEST_BYTES)") < cropDiseaseRoute.indexOf("new Response(boundedBody.bytes, { headers: request.headers }).formData()"), "declared and streamed upload size must be checked before multipart parsing");
assert.match(cropDiseaseRoute, /Number\.isSafeInteger\(declaredBytes\)[\s\S]*?declaredBytes > MAX_REQUEST_BYTES/, "invalid or oversized declared upload bodies must fail closed");
assert.match(cropDiseaseRoute, /\.eq\("user_id", user\.id\)/, "crop-disease history must be scoped to the authenticated user");
assert.match(cropDiseaseRoute, /user\.id \+ "\/" \+ crypto\.randomUUID\(\)/, "crop photo paths must be rooted in authenticated user ID");
assert.match(cropDiseaseMigration, /using \(\(select auth\.uid\(\)\) = user_id\)/, "crop diagnosis rows must be owner-readable");
assert.match(cropDiseaseMigration, /with check \(\(select auth\.uid\(\)\) = user_id\)/, "crop diagnosis inserts must be owner-bound");
assert.match(cropDiseaseMigration, /bucket_id = 'crop-disease-photos'[\s\S]*?storage\.foldername\(name\)/, "crop photo Storage policies must enforce owner-folder access");
assert.match(cropDiseaseMigration, /values \('crop-disease-photos', 'crop-disease-photos', false/, "crop photos must use a private Storage bucket");

const farmer = readFileSync("app/api/farmer/products/route.ts", "utf8");
const sellerDashboard = readFileSync("app/seller/page.tsx", "utf8");
const sellerForm = readFileSync("components/farmer/ProductForm.tsx", "utf8");
const productModeration = readFileSync("supabase/migrations/20261029140000_seller_product_moderation.sql", "utf8");
const serverAuthorization = readFileSync("lib/auth/server-authorization.ts", "utf8");
const moderationPage = readFileSync("app/admin/moderation/page.tsx", "utf8");
const moderationMigration = readFileSync("supabase/migrations/20261029150000_product_moderation_workflow.sql", "utf8");
const adminOverview = readFileSync("app/admin/page.tsx", "utf8");
const staffAccessPage = readFileSync("app/admin/access/page.tsx", "utf8");
const staffRoleMigration = readFileSync("supabase/migrations/20261029160000_staff_role_assignment.sql", "utf8");
const permissionCatalogue = readFileSync("lib/auth/permissions.ts", "utf8");
assert.match(farmer, /Farmer product creation failed/, "product insert failures must be logged server-side");
assert.match(farmer, /পণ্য সংরক্ষণ করা যায়নি/, "product insert failures must return safe localized message");
assert.doesNotMatch(farmer, /error: error\.message/, "database details must not be exposed by farmer product API");

assert.match(farmer, /authorizePermission\("catalog\.create_own"\)/, "seller listing API must use the shared capability guard");
assert.match(farmer, /role === "farmer" \|\| role === "seller"/, "both seller and farmer memberships may submit listings");
assert.match(farmer, /reseller_commission_percent: 0/, "seller API must not accept commission policy from the client");
assert.doesNotMatch(sellerForm, /commission/, "seller form must not expose commission policy controls");
assert.match(sellerDashboard, /\.eq\("farmer_id", auth\.user\.id\)/, "seller dashboard must query only the authenticated seller's listings");
assert.match(serverAuthorization, /Unable to verify permissions/, "permission lookup failures must fail closed");
assert.match(productModeration, /NEW\.status := 'draft'::public\.product_status/, "database must force new seller listings to draft");
assert.match(productModeration, /Listing status changes require moderation/, "seller must not bypass moderation via direct database updates");
assert.match(productModeration, /Commission changes require platform administration/, "seller must not change commission through direct database updates");
assert.match(productModeration, /role IN \('farmer', 'seller'\)/, "database policy must limit listing writes to seller/farmer roles");


assert.ok(moderationMigration.includes("moderation_status text NOT NULL DEFAULT"), "listing moderation state must be persisted");
assert.ok(moderationMigration.includes("admin_moderate_marketplace_product"), "moderation decisions must use a database RPC");
assert.ok(moderationMigration.includes("product.moderation."), "moderation decisions must be auditable");
assert.ok(moderationPage.includes("request_changes"), "moderators must be able to request seller changes");
assert.ok(moderationPage.includes("Approve & publish"), "approved listings must have an explicit publication action");
assert.ok(moderationPage.includes("super_admin"), "moderation page must check privileged roles");
assert.ok(adminOverview.includes("/admin/moderation"), "Super Admin must have a direct link to the moderation queue");

assert.ok(staffRoleMigration.includes("admin_set_staff_role"), "staff roles must be assigned through a dedicated database RPC");
assert.ok(staffRoleMigration.includes("Self-service staff role changes are not allowed"), "staff must not self-assign privileged roles");
assert.ok(staffRoleMigration.includes("staff.role.granted"), "staff role grants must be audited");
assert.ok(staffAccessPage.includes("Grant role") && staffAccessPage.includes("Revoke selected"), "Super Admin needs staff role grant/revoke controls");
assert.ok(adminOverview.includes("/admin/access"), "Super Admin console must link to staff access management");
assert.ok(permissionCatalogue.includes('"finance.read_scoped", "payout.review", "roles.assign_scoped", "audit.read"'), "admin capability set must include scoped staff provisioning");


const moderatorScopeMigration = readFileSync("supabase/migrations/20261029170000_separate_moderator_and_admin_scope.sql", "utf8");
assert.match(moderatorScopeMigration, /v_is_platform_admin boolean[\s\S]*public\.is_admin\(\)[\s\S]*m\.role IN \('admin', 'super_admin'\)/, "only platform admin/super-admin roles may use broad product write scope");
assert.match(moderatorScopeMigration, /Product moderators may only change moderation fields/, "moderators must not edit price, stock, commission, or ownership through direct writes");
assert.match(moderatorScopeMigration, /OLD\.farmer_id <> auth\.uid\(\)/, "moderators must not approve their own seller listings");
assert.match(moderatorScopeMigration, /INSERT INTO public\.admin_audit_log/, "moderator database transitions must be auditable");
assert.match(moderatorScopeMigration, /AND \(v_is_platform_admin OR farmer_id <> auth\.uid\(\)\)/, "moderation RPC must reject self-approval");


const articleGenerate = readFileSync("app/api/admin/article/generate/route.ts", "utf8");
const contentBrief = readFileSync("app/api/admin/content-brief/route.ts", "utf8");
const contentDraftGenerate = readFileSync("app/api/admin/content-drafts/generate/route.ts", "utf8");
const contentOpportunities = readFileSync("app/api/admin/content-opportunities/route.ts", "utf8");
const adminProductsApi = readFileSync("app/api/admin/products/route.ts", "utf8");
assert.match(articleGenerate, /authorizePermission\("content\.draft"\)/, "article draft endpoint must use content.draft capability");
assert.match(contentBrief, /authorizePermission\("content\.draft"\)/, "content brief endpoint must use content.draft capability");
assert.match(contentDraftGenerate, /authorizePermission\("content\.draft"\)/, "content generation endpoint must use content.draft capability");
assert.match(contentOpportunities, /requireContentPermission\("content\.review"\)/, "content queue must require content.review capability");
assert.match(contentOpportunities, /requireContentPermission\("content\.publish"\)/, "publishing transition must separately require content.publish capability");
assert.match(adminProductsApi, /authorizePermission\("catalog\.create_platform"\)/, "platform catalog creation must use catalog.create_platform capability");
assert.match(permissionCatalogue, /reseller\.links\.create_own/, "reseller link permission must be defined in the capability catalogue");
assert.match(permissionCatalogue, /buyer: \[\.\.\.ownAccount, "orders\.read_own", "orders\.create_own"\]/, "buyer role must receive own-order creation capability");


const jobPostAction = readFileSync("app/jobs/post/actions.ts", "utf8");
const jobApplyAction = readFileSync("app/jobs/[slug]/apply/actions.ts", "utf8");
assert.match(jobPostAction, /authorizePermission\("jobs\.create_own"\)/, "job posting must require the employer capability");
assert.match(jobApplyAction, /authorizePermission\("jobs\.apply_own"\)/, "job applications must require the job seeker/worker capability");
assert.match(permissionCatalogue, /employer: \[\.\.\.ownAccount, "jobs\.create_own"\]/, "employer role must receive job creation only");
assert.match(permissionCatalogue, /job_seeker: \[\.\.\.ownAccount, "jobs\.apply_own"\]/, "job seekers must receive application capability");
assert.match(permissionCatalogue, /worker: \[\.\.\.ownAccount, "jobs\.apply_own"\]/, "workers must receive application capability");


const jobRoleMigration = readFileSync("supabase/migrations/20261029190000_enforce_job_role_access.sql", "utf8");
assert.match(jobRoleMigration, /CREATE POLICY "Employers can create own job drafts"/, "job creation must have a dedicated RLS policy");
assert.match(jobRoleMigration, /p\.role = 'employer'/, "legacy employer profile role must be supported");
assert.match(jobRoleMigration, /m\.role = 'employer'/, "employer membership must be checked by RLS");
assert.match(jobRoleMigration, /CREATE POLICY "Job seekers can apply to published jobs"/, "job applications must have a dedicated role-scoped RLS policy");
assert.match(jobRoleMigration, /m\.role IN \('job_seeker', 'worker'\)/, "application RLS must restrict applicants to job seeker/worker memberships");

console.log("API/server-action capability, role-scoped RLS, moderator-scope, and error disclosure regression checks passed.");
