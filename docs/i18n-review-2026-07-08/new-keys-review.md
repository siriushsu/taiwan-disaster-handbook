# i18n Review — 54 new keys (vi / id / th / fil)

Date: 2026-07-08
Scope: last 54 keys `site_name` → `card_1991_hint` in
`lib/i18n/{vi,id,th,fil}.json`, compared against `zh-TW.json` and `en.json`.
Prior 120 keys not reviewed (already audited). Audience: migrant workers in
Taiwan; correctness prioritized over fluency.

## Summary

| Lang | CRITICAL | HIGH | MEDIUM |
|------|----------|------|--------|
| vi   | 0 | 0 | 0 |
| id   | 0 | 0 | 0 |
| th   | 0 | 0 | 0 |
| fil  | 0 | 0 | 0 (1 non-blocking note) |

Result: **all four languages — 掃畢無 CRITICAL / HIGH**.

## Verification performed

1. **Placeholder integrity (programmatic)** — the 4 keys carrying placeholders
   (`handbook_doc_title` `{name}`, `pages_count` `{n}`, `coord_updated` `{dist}`,
   `city_specific` `{city}`) all preserve the exact token in vi/id/th/fil.
   Zero mismatches, zero translated-away placeholders.
2. **Number-sensitive strings** — `em_1991_note` and `card_1991_hint`
   ("按1留言 按2聽" / "press 1 to record, 2 to listen"). All four languages keep
   1 = record/leave message, 2 = listen. No digit swaps.
   - vi: "Bấm 1 để ghi âm, bấm 2 để nghe" ✓
   - id: "Tekan 1 untuk merekam, 2 untuk mendengarkan" ✓
   - th: "กด 1 ฝากข้อความ กด 2 ฟังข้อความ" ✓
   - fil: "Pindutin ang 1 para mag-record, 2 para makinig" ✓
3. **Proper-noun / hotline terminology** — verified against Taiwan meanings:
   - `em_offices` 駐台辦事處 = home-country Representative Office →
     vi "Văn phòng đại diện", id "Kantor Perwakilan",
     th "สำนักงานตัวแทนประจำไต้หวัน", fil "Representative Office" — all correct.
   - `em_1955` 外籍勞工專線 (MOL migrant-worker line), `em_113` 婦幼保護,
     `em_1922` 疫情通報/CDC, `em_1991` 災害留言板 — all rendered correctly and
     consistently with en.
4. **Facility / directional terms** — `qr_caption` 避難地點 (shelters near home):
   vi "nơi trú ẩn", id "tempat evakuasi", th "ที่หลบภัย", fil "evacuation site"
   — all correct, no facility-type confusion.
5. **Full read-through of all 54 keys per language** for meaning reversal /
   misleading rendering — none found.

## Non-blocking note (below reporting threshold, recorded for completeness)

- **fil / `em_fire`**: "Sunog / Ambulansya" uses *Sunog* (the fire/blaze itself)
  while `label_fire_amb` uses "Bumbero / Ambulansya" (*Bumbero* = firefighters).
  Both are understood by native speakers and neither misleads or causes wrong
  action; this is an intra-app consistency nuance, not a grammar or meaning
  defect. Optional harmonization only — does not qualify as MEDIUM per the
  "native speaker would misunderstand" bar.

## Not evaluated (out of scope by instruction)

Tone, register, punctuation, and Taglish style choices in fil (e.g. `site_name`,
`card_title`, `card_meeting`, `em_offices` intentionally kept in English) — these
are established stylistic patterns, not errors.
