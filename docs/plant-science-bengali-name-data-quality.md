# Bengali common-name data-quality correction

Date: 2026-11-11

## Issue found

A catalogue audit found **266** records whose Bengali-name field contained `বন` (forest). This is a habitat/category label, not a Bengali common name. Several of those records were generated from broad forestry, ornamental, medicinal, and wild-crop-relative groups, so displaying the category as a plant name would mislead learners and search engines.

## Correction

- Replaced the invalid value with `প্রচলিত বাংলা নাম উল্লেখ নেই` for all 266 affected catalogue rows.
- Kept each English label, scientific-name string, family, learning group, and clue unchanged.
- Did not invent Bengali vernacular names or claim local usage without a source.
- Added a catalogue smoke-test assertion preventing the exact invalid value `বন` from returning in the Bengali-name field.

## Follow-up

This is a data-label correction, not taxonomic validation. Bengali vernacular names should be added later only with a traceable Bangladesh source (for example, a flora, herbarium record, or authoritative local plant reference). The taxonomy and Bangladesh-occurrence review statuses remain pending where they were pending before this correction.
