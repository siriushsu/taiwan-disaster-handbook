# Filipino (Tagalog) translation review — disaster-handbook

Reviewer standard: native Filipino speaker, calibrated to OFW (overseas Filipino worker) usage in Taiwan.
Sources compared per string: `lib/i18n/zh-TW.json` (semantic source of truth) + `lib/i18n/en.json` (reference).
Scope: all 118 keys of `lib/i18n/fil.json` + all 40 `fil` fields in `lib/migrant-phrases.ts`.

## Headline

Overall quality is **good**. The life-critical phrases (medical / safety / shelter / earthquake / air-raid / emergency numbers) are all **accurate and would not mislead action**. No residual Chinese, no broken `{placeholder}`, no untranslated leftovers. Taglish and English borrowings (`ARC number`, `agency`, `Emergency Contacts`, `mag-charge`, `mag-stay`) are used the way OFWs actually speak — correct localization, not errors.

- **must-fix: 0**
- **should-fix: 5** (1 grammar, 2 meaning-loss vs source, 1 idiom/consistency, 1 content omission)
- **polish: 6**

---

## MUST-FIX

None found. (Honest result — this is a solid translation. See judgment note at bottom.)

---

## SHOULD-FIX

### S1 — `footer_help_improve` (i18n)  — grammar broken
- Current: `Tulungan kami mapabuti`
- zh: `資料有誤？幫助我們改善` · en: `Help us improve`
- Problem: missing the ligature/linker and object; `Tulungan kami mapabuti` reads ungrammatical ("help us [to] be-improved" with no connector). A native reader parses the intent but it looks broken.
- Suggested: `Tulungan kaming pabutihin ito`  (Help us improve it)
- severity: should-fix · confidence: high

### S2 — `contact-office` (phrase) — under-specifies which office; loses "representative"
- Current: `Pakikontak ang aming tanggapan`  ("Please contact our office")
- zh: `請聯絡我的辦事處` · en: `Please contact my representative office`
- Problem: `tanggapan` alone = a generic "office." The sibling translations all keep the qualifier — vi `văn phòng đại diện`, id `kantor perwakilan`, th `สำนักงานตัวแทน` = **representative office**. For a Filipino this specifically means MECO (Manila Economic & Cultural Office in Taiwan). Dropping "representative" means a rescuer reading the card doesn't know *which* office to call — real loss of usefulness in an emergency.
- Suggested: `Pakikontak ang aming representative office`  (OFWs recognize "representative office"/MECO; matches file's English-borrowing style)
- severity: should-fix · confidence: high

### S3 — `privacy_notice` (i18n) — omits the "cleared on close" reassurance
- Current: `Lahat ng data ay nasa browser mo lamang, hindi ina-upload sa anumang server.`
- zh: `所有資料僅在你的瀏覽器中處理，不上傳任何伺服器，關閉即清除。` · en: `All data stays in your browser. Nothing uploaded. Cleared when you close the page.`
- Problem: both source languages end with "cleared when you close" — a deliberate privacy reassurance for users nervous about entering home address, meds, passport/ARC numbers. The fil drops it entirely.
- Suggested: `Lahat ng data ay nasa browser mo lamang, hindi ina-upload sa anumang server, at nabubura kapag isinara mo ang page.`
- severity: should-fix · confidence: high

### S4 — shelter term inconsistency: `silungan` (everywhere in i18n) vs `evacuation center` (phrase `where-shelter`)
- i18n uses `silungan` for shelter throughout (`site_title`, `disaster_shelters` = "Mga Silungan sa Sakuna", `stat_shelters_short`, etc.).
- Phrase `where-shelter` uses: `Nasaan ang evacuation center?`
- Problem: same concept, two different words across surfaces. Note: `evacuation center` is actually the **more natural OFW/Philippine term** for a disaster shelter (that's what DSWD facilities are called back home); `silungan` is correct standard Tagalog but reads more like generic "shelter/refuge from rain." Both are understood, so this is consistency + idiom, not an error.
- Recommendation (judgment call, NOT auto-applied): either accept the mismatch (both correct), or standardize toward `evacuation center` for OFW resonance. Renaming all `silungan` is invasive and space-sensitive in UI, so left out of the machine-fix file.
- severity: should-fix (low) · confidence: medium

### S5 — `handbook_ready_desc` (i18n) — content simplified away from source
- Current: `Pwede mong i-edit bago i-download`  ("You can edit before downloading")
- zh: `下載前可修改避難所資訊，確保內容正確` · en: `You can edit shelter info before downloading to ensure accuracy`
- Problem: source specifically tells the user they can edit *shelter info* to *ensure accuracy* (the whole point of the edit step, since shelter data can be wrong). The fil is generic and drops both the "shelter info" object and the "for accuracy" purpose.
- Suggested: `Pwede mong i-edit ang impormasyon ng silungan bago i-download para matiyak na tama.`
- severity: should-fix (low-med) · confidence: high

---

## POLISH (optional, low priority — not auto-applied)

- P1 `hero_stat_medical` / `medical_facilities` / `quick_result_nearest_medical`: `pasilidad medikal` — Spanish-style noun+adj order; more natural Filipino is `medikal na pasilidad`. Understood either way.
- P2 `hero_cta_full`: `Gumawa ng kumpletong handbook` drops "family/pamilya" (zh 家庭 / en "family handbook"). Could be `...handbook ng pamilya`. Minor; keep short for a button.
- P3 phrase `trapped`: `Na-trap ako` (Taglish) is fine/natural; `Naiipit ako` or `Nakulong ako` are more standard Filipino. No change needed.
- P4 `footer_open_source`: `welcome ang kontribusyon` — Taglish; acceptable. Could be `malugod na tinatanggap ang kontribusyon` for a more formal register.
- P5 phrase `not-paid`: `Hindi pa ako sumasahod` is understood; `Hindi pa ako nasusuwelduhan` / `Hindi pa ako binabayaran` are slightly more idiomatic.
- P6 `map_title`: `Mapa ng Emergency Facilities` — Taglish mix; acceptable. Fully-Filipino would be longer, so keep.

---

## Verified-correct highlights (no change)

- All MEDICAL phrases (`injured`, `bleeding`, `pregnant`, `cannot-breathe`, etc.) — accurate.
- All SAFETY phrases incl. `fire` (Sunog!), `earthquake` (Lindol), `help-me`, `call-police`, `call-1955` — accurate.
- All SHELTER phrases (`no-food`, `no-water`, `no-sleep`, `can-stay`, `charge-phone`) — accurate and natural.
- `my-employer` = `Ang amo ko ay` — "amo" is exactly the OFW word for employer. 
- `my-broker` = `Ang agency ko ay` — "agency" is the real OFW term for the Taiwan 仲介/broker; correct localization, not a mistranslation.
- `line_share_text` — `{shelter}` / `{distance}` placeholders intact and correctly placed.
- Proper nouns/borrowings kept correctly: 1955, LINE, AED, ARC, PDF.

## Reviewer judgment note
Marking 0 must-fix is deliberate, not a shortcut: every emergency-action string was checked against zh + en and against sibling-language translations, and none would cause a wrong action. The should-fix items are real (one grammar break, two meaning losses vs source, one idiom inconsistency, one content omission) but none are safety-critical.
