// Release gate: fail closed unless the exact main revision has passed required CI
// and its latest production deployment failed with a recognized Vercel quota error.
const { GH_TOKEN, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, APPROVED_SHA, REPOSITORY } = process.env;
if (![GH_TOKEN, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, APPROVED_SHA, REPOSITORY].every(Boolean)) {
  throw new Error("Missing required release configuration");
}
const github = async (path) => {
  const response = await fetch("https://api.github.com" + path, {
    headers: { Authorization: `Bearer ${GH_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
  return response.json();
};
const vercel = async (path) => {
  const response = await fetch("https://api.vercel.com" + path, {
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
  });
  if (!response.ok) throw new Error(`Vercel API error: ${response.status}`);
  return response.json();
};
const commit = await github(`/repos/${REPOSITORY}/commits/${APPROVED_SHA}`);
if (commit.sha !== APPROVED_SHA) throw new Error("Approved commit mismatch");
const runs = await github(`/repos/${REPOSITORY}/commits/${APPROVED_SHA}/check-runs?per_page=100`);
const required = ["quality", "content-migration-execution", "staging-http", "editorial-seo"];
for (const name of required) {
  const matches = runs.check_runs.filter((run) => run.name === name);
  if (!matches.length || matches.some((run) => run.status !== "completed" || run.conclusion !== "success")) {
    throw new Error(`Required check not successful: ${name}`);
  }
}
const { deployments } = await vercel(`/v6/deployments?projectId=${encodeURIComponent(VERCEL_PROJECT_ID)}&target=production&limit=20&teamId=${encodeURIComponent(VERCEL_ORG_ID)}`);
const matching = deployments.filter((d) => d.meta?.githubCommitSha === APPROVED_SHA);
if (matching.some((d) => d.readyState === "READY" || d.state === "READY")) {
  console.log("Approved commit is already deployed. No retry needed.");
  process.exit(0);
}
const latest = deployments[0];
if (!latest || latest.meta?.githubCommitSha !== APPROVED_SHA) {
  throw new Error("Latest production deployment is not for the approved commit. Refusing to deploy.");
}
if (!["ERROR", "CANCELED"].includes(latest.readyState ?? latest.state)) {
  throw new Error("Latest production deployment is not failed; no retry needed.");
}
const detail = await vercel(`/v13/deployments/${encodeURIComponent(latest.uid ?? latest.id)}?teamId=${encodeURIComponent(VERCEL_ORG_ID)}`);
const error = [detail.errorCode, detail.errorMessage, detail.error?.code, detail.error?.message].filter(Boolean).join(" ");
if (!/rate.?limit|quota|deployments?.?limit|builds?.?limit|too.?many.?requests/i.test(error)) {
  throw new Error("Deployment failure is not clearly quota-related. Manual review required.");
}
console.log("Approved revision passed checks; latest failed due to quota. Retry authorized.");
