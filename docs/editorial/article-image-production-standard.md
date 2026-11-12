# AGRIVA article image production standard (staging)

Status: editorial specification; not an automated image generation integration. Do not publish without review.

## Image assets
- Hero: **1200 × 630 px minimum**, target **1600 × 840 px** (40:21, approx. 1.905:1), landscape.
- Encode final hero as **WebP** (quality ~80–85); use **AVIF** when browser/build tooling reliably supports it. Keep a visually inspected fallback when needed.
- Aim for **under 250 KB** for hero images where visual quality permits; this is a performance target, not a hard validation threshold.
- Additional in-article visuals: 1200 × 800 px (3:2) for process photographs, 1200 × 1200 px for square reference illustrations where appropriate.
- Strip unnecessary metadata. Keep original source asset privately for audit; never expose image-generation credentials.
- Upload reviewed final hero to the staging Supabase Storage **article-hero-images** public bucket. The article publishing API requires a hosted URL at that bucket and dimensions >= 1200 × 630.
- Do not change the storage bucket or publishing validations without migration and security review.

## AI image generation and accuracy
- Generate a new, relevant image per article; avoid reusing generic agricultural imagery across unrelated crops.
- Prompt with exact crop species, growth stage, Bangladesh farming context, season, field conditions, lighting, composition and negative constraints.
- Do not fabricate photos of named real farmers, actual field experiments, laboratory results, diseases, or a specific product's branded packaging.
- Clearly identify generated illustrations where readers could otherwise mistake them for evidence. For diagnosing crop disease or identifying a product, prefer verified authentic photographs.
- A human editor checks botanical correctness, signs of disease, tools, labels, hands, crop anatomy, and absence of false claims before approval.
- Record AI-generation provenance in the article's image rights note; mark license/usage terms accurately and obtain any required commercial rights. AI generation alone does not establish exclusive copyright.

## SEO alt text
- Each informative image must have **one unique Bengali alt text** describing what is actually visible, naturally incorporating the article's primary keyword only when relevant.
- Usually 60–125 Bengali characters, concise rather than keyword-stuffed. No “ছবি”, “image of”, marketing claims, or unverified yield promises.
- Example for a genuine illustration of a pumpkin seedbed: `মিষ্টিকুমড়ার চারা তৈরির জন্য প্রস্তুত উঁচু বীজতলা ও সারিবদ্ধ চারা`.
- Decorative images use empty alt text at the rendering layer, if supported; hero images are informative and need meaningful alt text.
- SEO filename: lowercase English words separated by hyphens, e.g. `mishti-kumra-seedbed-bangladesh.webp`. Filenames do not replace alt text.
- Align the article title, caption, body and image subject; do not repeat the exact same alt text across different images.

## Editorial delivery checklist
1. Research search intent and validate claims using authoritative agriculture sources.
2. Draft the article, evidence list, internal links, metadata and image brief.
3. Generate the AI image and manually inspect the output.
4. Resize, encode, compress, record dimensions and rights, upload to staging Storage.
5. Set unique descriptive hero alt text; verify accessibility and mobile crop.
6. Save author/reviewer, evidence and image metadata in draft; review and approve.
7. Publish only after existing editorial security, SEO and provenance gates pass.

## Phase 1 proposed topic seeds (not keyword-volume-validated)
1. মিষ্টিকুমড়া চাষ পদ্ধতি ও বীজ বপনের নিয়ম
2. টমেটো চাষের মৌসুম ও চারা রোপণের নিয়ম
3. বেগুন চাষে বীজতলা তৈরি ও পরিচর্যা
4. ঢেঁড়স চাষে বীজ বপন ও জমি প্রস্তুতি
5. ফুলকপি চাষে চারা রোপণের সময়
6. বাঁধাকপি চাষে সার ও সেচ ব্যবস্থাপনা
7. পেঁপে চাষে বীজ নির্বাচন ও চারা প্রস্তুতি
8. শিম চাষে মাচা ও পরিচর্যা
9. গাজর চাষের মাটি ও বপন পদ্ধতি
10. পেঁয়াজ চাষে বীজতলা ও চারা রোপণ

These are candidate briefs, **not published articles** or confirmed search-volume rankings. Complete source/keyword validation before drafting the first 40-article calendar.
