export type ClaimEvidence = {
  claim: string; source_url: string; verified: boolean; verification_note: string;
};
export function reviewClaimEvidence(claims: ClaimEvidence[]) {
  const issues: string[] = [];
  if (!claims.length) issues.push("No claim-by-claim evidence provided.");
  for (const [i, claim] of claims.entries()) {
    if (!claim.claim?.trim()) issues.push(`Claim ${i + 1}: missing statement.`);
    try {
      const url = new URL(claim.source_url);
      if (url.protocol !== "https:" || !url.hostname.includes(".")) throw Error();
    } catch { issues.push(`Claim ${i + 1}: a valid HTTPS source is required.`); }
    if (claim.verified !== true || !claim.verification_note?.trim()) {
      issues.push(`Claim ${i + 1}: human verification and an explanation are required.`);
    }
  }
  return { readyForEditorialReview: issues.length === 0, issues,
    note: "A checked box is not proof: the reviewer must read the source and verify that it directly supports each factual claim." };
}
