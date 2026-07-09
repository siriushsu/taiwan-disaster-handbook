# disaster-handbook

Taiwan Family Emergency Handbook Generator — personalized disaster preparedness PDF for Taiwan families.

## Tech Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- @react-pdf/renderer v4 for client-side PDF generation
- Leaflet + html-to-image for map capture
- Deployed on Vercel (auto-deploy from GitHub)

## Commands

```bash
npm install --legacy-peer-deps   # install dependencies
npm run dev                       # start dev server on port 3000
npm run build                     # production build
npm run test                      # run tests with vitest
npm run gen:pdf-preview           # regen homepage PDF cover preview (see below)
```

## PDF preview pipeline

The homepage shows two pre-rendered PDF page thumbnails side by side —
`public/pdf-preview-cover.png` (the cover) and `public/pdf-preview-map.png`
(the shelter/map page) — so visitors see both the artifact and what's
inside before they commit to filling out the form.

**Rerun `npm run gen:pdf-preview` whenever you change `components/pdf/*.tsx`.**
This is not automated — the script runs locally, reads `components/pdf/HandbookPDF.tsx`
with a fixed Taipei/Xinyi sample household, and rasterizes pages 1 and 4 to
PNG via poppler's `pdftoppm` (requires `brew install poppler` on macOS).
Commit the regenerated PNGs along with the PDF change.

## PDF pagination rules (IMPORTANT)

@react-pdf/renderer splits any block that crosses a page boundary unless told
not to. Every atomic visual block in `HandbookPDF.tsx` (cards, info boxes,
checklist rows, the wallet card, the hand-drawn route box) carries
`wrap={false}` so it moves to the next page whole instead of being cut in
half; section titles carry `minPresenceAhead` so they aren't stranded at a
page bottom. **Any new block you add must follow the same pattern.**

After changing `HandbookPDF.tsx`, verify pagination with
`npx tsx scripts/stress-test-pdf-pagination.tsx` — it renders three
overflow-stressing scenarios (minimal form + max shelter data, 6-member
family, foreign-national bilingual) and prints the output PDF paths; open
them and eyeball every page for split blocks.

## Design System

Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Changelog habit (IMPORTANT)

**Every time you ship a user-visible change, update the changelog in `app/page.tsx`** (the `近期更新 / Recent Updates` `<details>` section around line 1385).

Rules:

- Add new entries at the TOP of the `<ul>`
- Each entry must have both Chinese and English text
- Date format: `M/D` (e.g. `4/15`) matching the existing style
- Also update the "資料更新：YYYY/M/D" date at the top of the summary block
- Write in plain language — what the user can now do, not technical details
- After updating, deploy with `npx vercel --prod` so the site reflects the change

Do NOT skip this. The changelog is how users see what's new.
