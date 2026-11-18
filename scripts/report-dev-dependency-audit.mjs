import { readFileSync, appendFileSync } from "node:fs";

const file = "dev-dependency-audit.json";
let audit;
try {
  audit = JSON.parse(readFileSync(file, "utf8"));
} catch (error) {
  console.error("Unable to read full dependency audit. Reporting must not be silently skipped.", error);
  process.exit(1);
}
if (audit.error || !audit.metadata?.vulnerabilities) {
  console.error("npm audit did not produce valid vulnerability metadata", audit.error || {});
  process.exit(1);
}

const counts = audit.metadata.vulnerabilities;
const lines = [
  "### Full dependency audit (including development tooling)",
  "",
  "| Severity | Findings |",
  "| --- | ---: |",
  ...["critical", "high", "moderate", "low"].map((severity) => `| ${severity} | ${Number(counts[severity] || 0)} |`),
  "",
  "Production dependency audit is a separate required blocking step.",
  "Development/build dependency advisories are tracked here, not misrepresented as patched.",
  "Review the attached dependency-advisories artifact before approving release.",
  "",
];

const vulnerable = Object.entries(audit.vulnerabilities || {});
for (const [name, entry] of vulnerable) {
  const severity = entry?.severity || "unknown";
  if (severity === "high" || severity === "critical") {
    const advisoryNames = (entry?.via || []).filter((item) => typeof item === "object").map((item) => item.name + ": " + (item.url || item.title || ""));
    lines.push(`- **${name}** (${severity}): ${advisoryNames.join("; ") || "transitive dependency advisory"}`);
  }
}

const markdown = lines.join("\n") + "\n";
console.log(markdown);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
if (Number(counts.high || 0) || Number(counts.critical || 0)) {
  console.warn("Unresolved development/tooling advisories still require upstream patches or audited replacements.");
}
