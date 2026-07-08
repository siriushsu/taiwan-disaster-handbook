# Vietnamese (vi) i18n Review — Taiwan Disaster Handbook

Reviewer standard: native Vietnamese speaker familiar with the language of Vietnamese migrant workers in Taiwan.
Sources compared: `lib/i18n/vi.json` (118 keys) vs `lib/i18n/zh-TW.json` (semantic source) + `lib/i18n/en.json`; `lib/migrant-phrases.ts` `vi` field of all 32 phrases vs `zh` + `en`.

## Headline

Overall the Vietnamese is **good quality** — well above typical raw machine output. All safety-critical vocabulary is correct and consistent (避難所→"Nơi trú ẩn", 防空→"Hầm phòng không", 地震→"Động đất", 失火→"Cháy rồi!", 緊急電話→"Số điện thoại khẩn cấp", 救護車→"xe cứu thương", 1955 preserved). The migrant-worker phrases in particular use *authentic in-community register* (chủ = employer, môi giới = broker, hộ chiếu bị giữ = passport withheld) rather than stiff dictionary Vietnamese. **No leftover Chinese/English, no broken `{shelter}` / `{distance}` placeholders, no ungrammatical strings.**

- **must-fix: 0**
- **should-fix: 5**
- **polish: 4**

No phrase in `migrant-phrases.ts` needs a fix — all 32 `vi` strings are correct and natural.

---

## MUST-FIX (0)

None. All action-guiding safety terms are semantically correct; nothing would misdirect a user during an earthquake / fire / air-raid.

---

## SHOULD-FIX (5)

### S1 — `privacy_notice` — privacy claim is incomplete
- Location: `vi.json` key `privacy_notice`
- Current: `Tất cả dữ liệu chỉ xử lý trong trình duyệt của bạn, không tải lên máy chủ nào.`
- Source zh: `所有資料僅在你的瀏覽器中處理，不上傳任何伺服器，關閉即清除。`
- Source en: `All data stays in your browser. Nothing uploaded. Cleared when you close the page.`
- Problem: The vi drops the third reassurance — "cleared when you close" (關閉即清除 / "Cleared when you close the page"). For a privacy-anxious migrant audience this is the strongest reassurance in the sentence and both zh and en keep it.
- Suggested: `Tất cả dữ liệu chỉ xử lý trong trình duyệt của bạn, không tải lên máy chủ nào và sẽ bị xóa khi bạn đóng trang.`
- Severity: should-fix · confidence: **high**

### S2 — `city` / `district` — "Huyện" is reused for two different address levels
- Location: `vi.json` keys `city` and `district`
- Current: `city` = `Thành phố / Huyện`  ·  `district` = `Quận / Huyện`
- Source: `city` = 縣市 / "City / County"  ·  `district` = 區/鄉/鎮市 / "District / Township"
- Problem: The word **Huyện appears in BOTH fields**, so the top-level unit (縣) and the sub-level unit (鄉/鎮) read as the same word — the two address dropdowns become ambiguous. "Thành phố / Huyện" for the county level is acceptable Vietnamese convention (媒體 do call Taiwan 縣 "huyện"), but the *district* field then needs a different word to disambiguate.
- Suggested: keep `city` as is; change `district` to `Quận / Thị trấn` (matches en "District / Township" and removes the Huyện collision). Alternative: `Khu / Thị trấn`.
- Severity: should-fix · confidence: **medium** (Taiwan→Vietnamese admin mapping is genuinely fuzzy for 鄉; the fix direction is safe, the exact word is a judgment call — not placed in the auto-apply JSON)

### S3 — `preview_caption` — 信義 romanization is inconsistent inside the same file
- Location: `vi.json` key `preview_caption`
- Current: `Sổ tay bạn sẽ nhận được (ví dụ: Quận Tín Nghĩa, Đài Bắc)`
- Problem: 信義 is rendered here as Sino-Vietnamese **"Tín Nghĩa"**, but in `address_placeholder` the very same district is romanized as **"Xinyi"** (`... Đường Xinyi`). One file, two spellings of the same place. Migrant workers navigate by the romanized names on Taiwan street/MRT signage ("Xinyi"), not the Sino-Vietnamese reading. Đài Bắc (Taipei) is fine to keep — it is universally known — but the district should match the placeholder.
- Suggested: `Sổ tay bạn sẽ nhận được (ví dụ: Quận Xinyi, Đài Bắc)`
- Severity: should-fix · confidence: **medium-high**

### S4 — `has_pets` — "vật nuôi" is broader than "pets"
- Location: `vi.json` key `has_pets`
- Current: `Có vật nuôi`
- Source zh: `家中有寵物` / en: `Have pets at home`
- Problem: `vật nuôi` covers domestic animals/livestock generally; the intended meaning (寵物 / companion pets) is `thú cưng`, which is the standard modern term and matches the `pet_placeholder` examples (dog/cat). Understandable as-is, but `thú cưng` is the natural word.
- Suggested: `Có thú cưng`
- Severity: should-fix · confidence: **medium-high**

### S5 — `prev_step` — same word as two other back-buttons
- Location: `vi.json` key `prev_step`
- Current: `Quay lại`  (also used verbatim by `go_back` and `back_to_home`)
- Source zh: `上一步` / en: `Previous`
- Problem: In a 3-step form, "previous step" is labeled identically to "back to home" (`back_to_home` = `Quay lại`). English distinguishes Previous / Go back / Back. Not wrong, but `Bước trước` reads unambiguously as "previous step".
- Suggested: `Bước trước`
- Severity: should-fix · confidence: **low** (borderline polish)

---

## POLISH (4)

- `handbook_ready_desc` — Current `Bạn có thể chỉnh sửa trước khi tải xuống` drops "shelter info" and "to ensure accuracy" from zh/en (`下載前可修改避難所資訊，確保內容正確`). Optional fuller form: `Bạn có thể chỉnh sửa thông tin nơi trú ẩn trước khi tải xuống để đảm bảo chính xác.` confidence: high (but non-critical omission).
- Term consistency for "disaster-prevention handbook": `hero_cta_full` uses `phòng chống thiên tai` while `generate` and `line_share_text` use the shorter `phòng thiên tai`. Both are understood; standardize on `phòng chống thiên tai`. confidence: medium.
- `contacts_title` = `Liên hệ khẩn cấp` renders 緊急聯絡人 (contact *person*) as the *action*. `Người liên hệ khẩn cấp` is more precise; current is fine for a short heading. confidence: medium.
- `refill` = `Làm lại` for 重新填寫 / "Start over" is acceptable; `Điền lại` ("fill again") maps more literally. confidence: low.

---

## Confirmed correct (spot notes, no action)

- migrant-phrases `my-employer` = `Chủ của tôi là`, `want-change-employer` = `Tôi muốn đổi chủ` — `chủ` is exactly the in-community word for employer. Correct, not a defect.
- migrant-phrases `passport-taken` = `Hộ chiếu của tôi bị giữ` — "bị giữ" (withheld/held) is the accurate real-world framing for a broker/employer holding a passport; better than a literal "bị lấy đi". Correct.
- migrant-phrases `contact-office` = `văn phòng đại diện` — correct term for the representative office. Correct.
- migrant-phrases `need-translator` = `phiên dịch` (oral interpreter) — correct for an emergency, more apt than `biên dịch`.
- `emergency_cta`, `call-ambulance`, `call-police`, `call-1955`, `fire`, `earthquake`, `where-shelter` — all safety/action strings verified correct and internally consistent with the UI `Nơi trú ẩn` / `Hầm phòng không` terminology.
- `line_share_text` — `{shelter}` and `{distance}` placeholders intact and correctly positioned.
