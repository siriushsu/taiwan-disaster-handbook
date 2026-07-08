# Indonesian (id) Translation Review — Taiwan Disaster Handbook

Reviewer standard: native Indonesian, targeting Indonesian migrant workers in Taiwan (TKI/PMI).
Sources compared: `lib/i18n/id.json` (118 keys) vs `lib/i18n/zh-TW.json` (semantic source) + `lib/i18n/en.json`; `lib/migrant-phrases.ts` `id` field of every phrase vs `zh`/`en`.

## Headline

Overall quality is **high**. No must-fix errors: no residual English/Chinese in Indonesian values, `{shelter}`/`{distance}` placeholders intact, no life-critical mistranslation, proper nouns (1955, 119, LINE, AED, PDF, ARC, HP) correctly left untranslated. The findings below are should-fix and polish only. Terminology is internally consistent (e.g. "tempat perlindungan" used the same way in both files).

---

## MUST-FIX
None found.

---

## SHOULD-FIX

### S1 — `migrant-phrases.ts` phrase `no-sleep`  (confidence: HIGH, auto-applied)
- zh: 我沒有地方睡  ·  en: I have no place to sleep
- Current id: **"Saya tidak punya tempat tidur"**
- Problem: `tempat tidur` is the fixed noun for **"a bed"**, not "a place to sleep". A native reader hears "I don't have a bed", narrowing the meaning; the intent (in a shelter) is "I have nowhere to sleep/stay". `tempat untuk tidur` = "a place to sleep".
- Suggested: **"Saya tidak punya tempat untuk tidur"**
- Severity: should-fix (shelter/life context, changes nuance the person is trying to convey to staff).

### S2 — `id.json` key `privacy_notice`  (confidence: HIGH, auto-applied)
- zh: 所有資料僅在你的瀏覽器中處理，不上傳任何伺服器，**關閉即清除**。
- en: All data stays in your browser. Nothing uploaded. **Cleared when you close the page.**
- Current id: **"Semua data diproses di browser Anda, tidak diunggah ke server manapun."**
- Problem: the final clause — data is **cleared when the page closes** — is dropped. This is a meaningful privacy reassurance (relevant to migrant workers wary of surveillance), present in both zh and en.
- Suggested: **"Semua data diproses di browser Anda, tidak diunggah ke server manapun, dan terhapus saat Anda menutup halaman."**
- Severity: should-fix (content omission on a trust/privacy message).

### S3 — Terminology: "tempat perlindungan" for evacuation shelter  (confidence: MEDIUM, NOT auto-applied)
- Affects: `site_title`, `hero_stat_shelters`, `quick_result_nearest_shelter`, `disaster_shelters` ("Tempat Perlindungan Bencana"), `where-shelter` phrase, etc.
- Observation: Indonesia's standard disaster-shelter term (BNPB / news usage a TKI hears) is **"tempat pengungsian"** (evacuation shelter). "Tempat perlindungan" = "place of protection/shelter" — understandable, but not the idiomatic disaster term.
- Why NOT auto-applied: (a) it is used **consistently** across the whole app and is understandable, so it is not wrong; (b) "perlindungan" is the *correct* word for the air-raid case (防空 = protection from air raids), so a blanket swap would break that; (c) changing only the disaster-shelter keys risks new inconsistency. This is a holistic terminology decision for the owner, not a mechanical fix.
- If the owner wants the more idiomatic term: use "tempat pengungsian" for disaster/evacuation shelters (`disaster_shelters`, `hero_stat_shelters`, `quick_result_nearest_shelter`, `where-shelter`) while keeping "perlindungan serangan udara" for air-raid keys. Recommend deciding as a set, then updating both `id.json` and `migrant-phrases.ts` together.

---

## POLISH (low priority, not auto-applied)

- **`id.json` `stat_airraid_short`** = "Anti-serangan udara". Reads as "anti-air-raid"; slightly clunky as a stat label. Optional: "Perlindungan udara" — but potentially ambiguous, so confidence low. Leave unless the owner wants it tighter.
- **`id.json` `prev_step`** = "Kembali" (= "Back"). zh/en is "上一步 / Previous". In a 3-step wizard "Sebelumnya" is more precise, but "Kembali" is acceptable and matches the app's other back buttons (`go_back`, `back_to_home` also "Kembali"). Low priority.
- **`id.json` `house`** = "Rumah" (generic "house") for zh 透天厝 / en "Townhouse". As the middle option between apartment and rural it is clear enough; "Rumah tapak" would be more specific but is unnecessary. Leave.
- **`migrant-phrases.ts` `trapped`** = "Saya terjebak". Understood as "I'm trapped", though "terjebak" can also read as "stuck/tricked". "Saya terperangkap" is marginally clearer for physically trapped (e.g. under rubble). Low confidence; keep unless owner prefers.

---

## Notes on things verified as CORRECT (spot list, migrant-usage sensitive)
- `my-employer` = "Majikan saya" — "majikan" is the term TKI actually use for employer. Correct.
- `my-broker` = "Agen saya" — neutral, understood (vs pejorative "calo"). Correct.
- `contact-office` = "kantor perwakilan saya" — matches Indonesia's representative office (KDEI) in Taiwan. Correct.
- `charge-phone` = "Saya perlu mengecas HP" — natural colloquial (HP = handphone, mengecas = charge). Correct.
- `no_shelters` = "...kantor kelurahan setempat" — "kelurahan" is the right analogue of Taiwan's 里辦公室. Correct.
- `not-paid` = "Gaji saya belum dibayar", `want-change-employer` = "Saya mau ganti majikan" — natural, colloquial-correct. Correct.
- All identity sentence-starters ("Nama saya", "Nomor paspor saya", "Saya dari" …) are grammatically complete once the value is appended (Indonesian needs no copula). Correct.
