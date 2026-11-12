"use client";
import { useState } from "react";

type Claim = { claim: string; source_url: string; verification_note: string; verified: boolean };
type Props = {
  id: string; status: string; initial: {
    author_name: string | null; reviewer_name: string | null; hero_image_url: string | null;
    hero_image_width: number | null; hero_image_height: number | null; hero_image_alt: string | null;
    hero_image_license: string | null; hero_image_rights_note: string | null;
    claim_evidence: unknown; author_verified_by: string | null; hero_image_verified_by: string | null;
  };
};
const field = "mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm";
export default function ArticleEvidenceEditor({ id, status: initialStatus, initial }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [authorName, setAuthorName] = useState(initial.author_name || "");
  const [reviewerName, setReviewerName] = useState(initial.reviewer_name || "");
  const [heroImageUrl, setHeroImageUrl] = useState(initial.hero_image_url || "");
  const [heroImageWidth, setHeroImageWidth] = useState(initial.hero_image_width || 0);
  const [heroImageHeight, setHeroImageHeight] = useState(initial.hero_image_height || 0);
  const [heroImageAlt, setHeroImageAlt] = useState(initial.hero_image_alt || "");
  const [heroImageLicense, setHeroImageLicense] = useState(initial.hero_image_license || "");
  const [heroImageRightsNote, setHeroImageRightsNote] = useState(initial.hero_image_rights_note || "");
  const [claims, setClaims] = useState<Claim[]>(Array.isArray(initial.claim_evidence) ? initial.claim_evidence as Claim[] : []);
  const [authorIdentityConfirmed, setAuthorIdentityConfirmed] = useState(Boolean(initial.author_verified_by));
  const [imageRightsConfirmed, setImageRightsConfirmed] = useState(Boolean(initial.hero_image_verified_by));
  const [sourceReviewConfirmed, setSourceReviewConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const patchClaim = (index: number, patch: Partial<Claim>) => setClaims(prev => prev.map((c,i) => i === index ? { ...c, ...patch, verified: patch.verified ?? (patch.claim !== undefined || patch.source_url !== undefined || patch.verification_note !== undefined ? false : c.verified) } : c));
  async function upload() {
    if (!imageFile) return;
    setBusy(true); setMessage("");
    try {
      const data = new FormData(); data.set("image", imageFile);
      const response = await fetch("/api/admin/articles/image", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");
      setHeroImageUrl(result.url); setHeroImageWidth(result.width); setHeroImageHeight(result.height);
      setImageRightsConfirmed(false); setMessage("Image dimensions verified from actual file. Review usage rights before saving.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Upload failed"); }
    finally { setBusy(false); }
  }
  async function save(nextStatus: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/articles/${id}/editor`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus, authorName, reviewerName, heroImageUrl,
          heroImageWidth, heroImageHeight, heroImageAlt, heroImageLicense, heroImageRightsNote,
          claimEvidence: claims, authorIdentityConfirmed, imageRightsConfirmed, sourceReviewConfirmed }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save");
      setStatus(result.article.status);
      setMessage(`Saved: ${result.article.status}${result.article.published_at ? " · Published " + result.article.published_at : ""}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save"); }
    finally { setBusy(false); }
  }
  const editable = status !== "published";
  const next: Record<string, string[]> = {
    draft: ["review"], review: ["draft","approved","rejected"],
    approved: ["review","published"], published: ["review"], rejected: ["draft"],
  };
  return <section className="mt-5 space-y-5 rounded-2xl bg-white p-6 shadow-sm">
    <div><h2 className="text-xl font-black">Editorial evidence & publication</h2><p className="mt-2 text-sm text-slate-600">Current status: {status}. Verify every factual claim against its source; a checkbox does not establish truth.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Verified author byline<input disabled={!editable} className={field} value={authorName} onChange={e => {setAuthorName(e.target.value);setAuthorIdentityConfirmed(false);}} /></label>
      <label className="text-sm font-semibold">Reviewer display name<input disabled={!editable} className={field} value={reviewerName} onChange={e => setReviewerName(e.target.value)} /></label>
    </div>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={!editable} checked={authorIdentityConfirmed} onChange={e => setAuthorIdentityConfirmed(e.target.checked)} /> I verified the author's identity and have permission to publish this byline.</label>
    <div className="space-y-3 border-t pt-4"><h3 className="font-bold">Discover hero image</h3>
      <label className="block text-sm">Upload owned/licensed JPEG, PNG or WebP (minimum 1200×630, maximum 10 MB)
        <input disabled={!editable} type="file" accept="image/jpeg,image/png,image/webp" className={field} onChange={e => {setImageFile(e.target.files?.[0] || null);setImageRightsConfirmed(false);}} />
      </label>
      <button type="button" disabled={busy || !imageFile || !editable} onClick={upload} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Upload & inspect actual image</button>
      {heroImageUrl && <div className="space-y-2"><img src={heroImageUrl} alt={heroImageAlt || "Uploaded image preview"} className="max-h-72 w-full rounded-lg object-contain" /><p className="break-all text-xs text-slate-600">{heroImageWidth}×{heroImageHeight} · {heroImageUrl}</p></div>}
      <label className="block text-sm font-semibold">Descriptive alt text<input disabled={!editable} className={field} value={heroImageAlt} onChange={e => setHeroImageAlt(e.target.value)} /></label>
      <label className="block text-sm font-semibold">License / ownership basis<input disabled={!editable} className={field} placeholder="Owned photo, licensed stock, CC BY with attribution..." value={heroImageLicense} onChange={e => {setHeroImageLicense(e.target.value);setImageRightsConfirmed(false);}} /></label>
      <label className="block text-sm font-semibold">Rights evidence / attribution / permission record<textarea disabled={!editable} className={field} rows={2} value={heroImageRightsNote} onChange={e => {setHeroImageRightsNote(e.target.value);setImageRightsConfirmed(false);}} /></label>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={!editable} checked={imageRightsConfirmed} onChange={e => setImageRightsConfirmed(e.target.checked)} /> I checked the image, source, usage license and permissions. Automated inspection validates image dimensions only.</label>
    </div>
    <div className="space-y-3 border-t pt-4"><div className="flex items-center justify-between"><h3 className="font-bold">Claim-by-claim source verification</h3><button type="button" disabled={!editable || claims.length >= 100} onClick={() => {setClaims(prev => [...prev, { claim:"",source_url:"",verification_note:"",verified:false }]);setSourceReviewConfirmed(false);}} className="rounded-lg border px-3 py-2 text-sm">+ Add claim</button></div>
      {claims.map((claim,i) => <div key={i} className="space-y-2 rounded-xl border p-3">
        <div className="flex justify-between"><strong className="text-sm">Claim {i+1}</strong><button type="button" disabled={!editable} className="text-sm text-red-700" onClick={() => {setClaims(prev => prev.filter((_,j) => i !== j));setSourceReviewConfirmed(false);}}>Remove</button></div>
        <label className="block text-sm">Exact factual claim<textarea disabled={!editable} className={field} rows={2} value={claim.claim} onChange={e => {patchClaim(i,{claim:e.target.value});setSourceReviewConfirmed(false);}} /></label>
        <label className="block text-sm">Source URL (HTTPS)<input disabled={!editable} type="url" className={field} value={claim.source_url} onChange={e => {patchClaim(i,{source_url:e.target.value});setSourceReviewConfirmed(false);}} /></label>
        {claim.source_url.startsWith("https://") && <a href={claim.source_url} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-800 underline">Read source in a new tab</a>}
        <label className="block text-sm">Source passage, publication date, crop/location applicability and verification notes<textarea disabled={!editable} className={field} rows={3} value={claim.verification_note} onChange={e => {patchClaim(i,{verification_note:e.target.value});setSourceReviewConfirmed(false);}} /></label>
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={!editable} checked={claim.verified} onChange={e => {patchClaim(i,{verified:e.target.checked});setSourceReviewConfirmed(false);}} /> I read this source and confirmed it supports the exact claim.</label>
      </div>)}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" disabled={!editable} checked={sourceReviewConfirmed} onChange={e => setSourceReviewConfirmed(e.target.checked)} /> I checked all material factual claims, not just the claims listed above; unsupported claims were removed or qualified.</label>
    </div>
    {message && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm">{message}</p>}
    <div className="flex flex-wrap gap-2">
      {editable && <button type="button" disabled={busy} onClick={() => save(status)} className="rounded-lg border border-emerald-800 px-4 py-2 text-sm font-bold disabled:opacity-40">Save editorial metadata</button>}
      {(next[status] || []).map(target => <button key={target} type="button" disabled={busy} onClick={() => save(target)} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">{target === "published" ? "Publish (verified only)" : `Move to ${target}`}</button>)}
    </div>
  </section>;
}
