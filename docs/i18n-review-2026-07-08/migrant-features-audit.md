# 移工／外籍人士功能稽核報告

日期：2026-07-08
Repo：/Users/xuxiang/SiriusCodeBundle-2026-06-30/Desktop/disaster-handbook

---

## CRITICAL — 電話／地址與官方來源不符（救命資料）

### C1. 菲律賓 MECO（馬尼拉經濟文化辦事處）電話疑似錯誤

- **檔案**：`lib/foreign-resources.ts:41-45`
  ```
  embassy: "馬尼拉經濟文化辦事處",
  embassyPhone: "(02) 2508-1719",
  embassyAddress: "台北市內湖區洲子街55/57號10樓",
  emergencyPhone: "0966-480-702",
  ```
- **官方來源比對**（外交部 MOFA 官網直接 fetch，https://www.mofa.gov.tw/OfficesInROC_Content.aspx?n=169&sms=86&s=126&os=18；MECO 官網 www.meco.org.tw 基本資訊一致）：
  - 電話：**02-2658-8825**（repo 的 2508-1719 在任何官方來源都查無對應，且與此完全不同）
  - 地址：**2樓**（洲子街55,57號 2F），repo 寫 **10樓** — 樓層錯誤
  - 傳真：02-2658-8867
- **緊急/移工協助專線（ATN）查證結果不一致，需人工再確認**：
  - taiwanofw.com（移工社群資源站）：02-2658-8560 / 02-2658-8825 分機731
  - 另一搜尋結果（AI 摘要，未附原始頁面）：0966-537-732，或 02-2658-9210 / 02-2658-9211
  - repo 的 `0966-480-702`：**查無任何官方或第三方來源佐證**
- **結論**：`embassyPhone` 高信心判定為錯誤（多個獨立來源一致指向 02-2658-8825，與 repo 值完全不同數字組合，不像是格式誤植）。`emergencyPhone` 查無法確認正確性，建議下架或改標「請致電總機轉接」，不要顯示未經證實的號碼。
- 來源：
  - https://www.mofa.gov.tw/OfficesInROC_Content.aspx?n=169&sms=86&s=126&os=18
  - https://www.meco.org.tw/
  - https://taiwanofw.com/contact-assistance-to-nationals-section-meco/

### C2. 越南辦事處地址錯誤（電話正確）

- **檔案**：`lib/foreign-resources.ts:25-28`
  ```
  embassy: "駐台北越南經濟文化辦事處",
  embassyPhone: "(02) 2516-6626",   ← 正確
  embassyAddress: "台北市松山區民生東路三段65號3-4樓",  ← 街道錯誤
  ```
- **官方來源**（MOFA 直接 fetch）：地址應為「臺北市**松江路**65號2-3樓」（松江路，非民生東路三段；樓層 2-3樓，repo 寫 3-4樓）。電話 02-2516-6626 兩邊一致，正確。
- 來源：https://www.mofa.gov.tw/OfficesInROC_Content.aspx?n=169&sms=86&s=128&os=26

### C3. 泰國辦事處地址樓層錯誤；電話為分機非總機

- **檔案**：`lib/foreign-resources.ts:47-52`
  ```
  embassy: "泰國貿易經濟辦事處",
  embassyPhone: "(02) 2773-1100",
  embassyAddress: "台北市大安區市民大道三段206號20樓",  ← 樓層錯誤
  ```
- **官方來源**（TTEO 官網聯絡頁直接 fetch）：地址「市民大道三段206號**1樓**」（repo 寫 20樓，差 19 層）。電話方面，TTEO 官網列出的代表號是 **(886) 2 2775 2211**（泰國公民服務分機110-119）；`2773-1100` 是「簽證服務」專線，非總機。若使用者遇緊急狀況撥打 repo 提供的號碼，可能只接通簽證櫃檯而非總機/急難救助窗口。
- 來源：https://tteo.thaiembassy.org/cn/page/contacttteo

### C4. 印尼辦事處資料正確（對照組，PASS）

- `lib/foreign-resources.ts:33-36`：電話 (02) 8752-6170、地址瑞光路550號6樓，與官方來源（MOFA + roc-taiwan.org）一致，無誤。
- 來源：https://www.mofa.gov.tw/OfficesInROC_Content.aspx?n=169&sms=86&s=176&os=59

### 一致性檢查（app/emergency/page.tsx vs lib/foreign-resources.ts）

- **PASS**：`app/emergency/page.tsx` 沒有另外寫死一份辦事處資料，而是直接 `import { FOREIGN_RESOURCES } from "@/lib/foreign-resources"`（`app/emergency/page.tsx:4,97`），`app/page.tsx:12` 也是同一 import。單一資料來源，兩檔案不會不一致——但也代表 `lib/foreign-resources.ts` 一旦有錯，全站（表單下拉選單、PDF、緊急撥號頁）全部同步出錯，C1-C3 的影響範圍是全站級。

---

## HIGH

### H1. 移工用語卡（生死攸關短句）為機器翻譯且未過母語人士審校，PDF 未顯示警語

- `lib/migrant-phrases.ts:4-10` 原始碼註解明載：越/印/泰/菲四語「Reviewed (Gemini 2026-04-16, **pending native speaker validation**)」——即目前是 AI 翻譯，尚未經母語人士確認，且 `docs/outreach-email-template.md` 顯示這封徵求審校信截至目前狀態仍是「邀請中」，尚未確認已完成審校。
- `lib/pdf-i18n.ts:991` 定義了警語文案 `phrase_card_draft: "[草稿 — 待母語人士審校]" / "[Draft — pending native speaker review]"`，但實際搜尋 `components/pdf/HandbookPDF.tsx` **完全沒有引用 `phrase_card_draft`**（grep 零命中）——警語文案存在卻從未被 render，使用者拿到 PDF 看不到任何「此翻譯未經驗證」的提示。
- 內容包含「我被虐待」「我沒有領到薪水」「請叫警察」「救命」等高風險短句（`lib/migrant-phrases.ts:145-374`），翻譯有誤會直接影響移工能否被正確理解與救援。
- 檔案：`lib/migrant-phrases.ts:1-16`、`lib/pdf-i18n.ts:990-992`、`components/pdf/HandbookPDF.tsx:2725-2830`（render 區塊，未含 draft 警語）

### H2. /handbook 與 /emergency 兩個頁面完全脫離 i18n 系統，正是移工最需要的頁面

- **/emergency**（`app/emergency/page.tsx`）：grep `useLocale|locale|LocaleSwitcher|i18n` 零命中。全頁 119/110/1955/113 等按鈕文字（`app/emergency/page.tsx:9-48`）與辦事處清單全部寫死繁中，無論使用者在首頁選了什麼語言，這頁一律中文。
- **/handbook**（`app/handbook/page.tsx`）：只 import `BiMode`（`lib/pdf-i18n.ts`，僅控制 PDF 內文 zh/en 兩檔），與站台 6 語系 `lib/i18n`（含 vi/id/th/fil）完全無關聯；周邊網頁 UI（如「避難所資訊（可修改）」`:461`、「資料有誤？幫助我們改善」`:851`、下載按鈕提示等）全部寫死繁中。
- **導覽時語言狀態直接遺失**：`app/page.tsx:391` `window.location.href = "/handbook"` 是純 URL 跳轉，未帶 `?lang=` 或任何 locale 參數；`app/page.tsx:817` 連到 `/emergency` 的連結同樣沒有帶語言參數。對照首頁本身有完整的 `?lang=` query 同步機制（`app/page.tsx:161-170`），可見不是技術限制，是這兩頁沒接上。
- **`components/EmergencyCardView.tsx`**（在 /handbook 頁內 render 的「緊急聯絡卡」，設計上是要給移工截圖存手機/印出來放皮夾的功能）：grep `locale` 零命中，`緊急聯絡卡`、`家人平日所在地` 等全部寫死繁中（`components/EmergencyCardView.tsx:22-33`）。
- **實際影響**：一位選了越南語、全程用越南語填完表單的移工，送出後看到的「手冊已完成」頁、避難所地圖說明、可截圖的緊急聯絡卡，以及 `/emergency` 一鍵撥打頁——這三個他在災難當下最可能實際使用的畫面——全部變回純中文，越南語選擇形同只在表單填寫階段有效。
- 對照：`components/form/MemberForm.tsx:16,26,29` 雖然接了 `locale` prop，但只做 `isZh` 布林判斷（中文 vs. 其餘一律當英文），並未真正支援 vi/id/th/fil 四語，同一模式的局部 i18n。

---

## MEDIUM

### M1. 移工健康服務中心資料全國僅 2 筆，且無距離上限，PDF 幾乎必然出現「不近的最近點」

- `public/data/taiwan-migrant-health-centers.json`：僅 2 筆，分別在桃園龍潭、高雄小港。
- `lib/client-lookup.ts:29-42`（`findNearest` 函式）：只做排序取前 N 筆，**沒有距離上限（no max-distance cutoff）**。
- `lib/client-lookup.ts:528-531`：`findNearest(migrantHealth, lat, lng, 3)` 對全台任何座標都會回傳這 2 筆（因為總共只有 2 筆可選）。
- `components/pdf/HandbookPDF.tsx:2644-2645`：`if (centers.length === 0) return null` —— 因為 `findNearest` 對 2 筆資料的清單不可能回傳空陣列，這個 section **對全台灣任何地址都會顯示**。
- 雖然有顯示距離（`components/pdf/HandbookPDF.tsx:2701` `{c.distance ? distText(c.distance) : ""}`）讓使用者能自行判斷遠近，但花蓮、台南、金門等地的移工家庭會在 PDF 上看到一個「外籍移工服務中心」區塊，內容其實是 100-300 公里外的機構，缺少「僅桃園/高雄有此服務」之類的說明。

### M2. `taiwan-migrant-health-centers.json` 未列入 Service Worker 離線快取清單

- `public/sw.js:6-15`（`DATA_ASSETS`）目前只快取 8 個資料檔（shelters／air-raid／medical／aed／fire-stations／police-stations／mrt-shelters／nursing），**沒有 `taiwan-migrant-health-centers.json`**。
- 影響：App 主打「離線可用」（`app/emergency/page.tsx:121` 明寫「離線可用 / Works offline」），但外籍移工專屬的這份資料不在預快取清單內，離線情境下若需重新查詢會失敗，是唯一被漏掉的資料集。

---

## LOW / 觀察

### L1. 首頁「外籍移工模式」banner 文案與實際 PDF 行為不符

- `app/page.tsx:630-634`：worker 模式文案宣稱「1955 / 113 / 用語卡 / 雇主資訊」、resident 模式文案宣稱「辦事處 / 用語卡」，暗示兩種身分會拿到不同內容。
- 但 `components/pdf/HandbookPDF.tsx` 內，1955/113 熱線（`:1740-1746`）、用語卡（`:2726`）、辦事處資訊（`:2449`）全部只用 `household.isForeignNational` 判斷是否顯示，**完全不看 `foreignType`（worker/resident）**。兩種身分拿到的 PDF 內容一模一樣。
- `foreignType` 唯一的實際作用：在網頁表單第一步，選 "worker" 才會顯示雇主/仲介姓名電話輸入框（`app/page.tsx:1586-1649`）；而 PDF 是否印出雇主/仲介卡片，判斷式是 `household.employerName || household.brokerName`（`components/pdf/HandbookPDF.tsx:2546`），只看欄位有沒有填值，不看 `foreignType`——理論上即使選 resident，只要手動填了雇主資訊也會出現在 PDF。
- 屬文案誤導而非功能壞掉，但會讓使用者誤以為選錯身分類型會少拿到救命資訊。

---

## 逐項回答任務問題

**1. 電話查證**：見上方 C1-C4。app/emergency/page.tsx 與 lib/foreign-resources.ts 之間**資料一致**（單一來源，同一份 import），但來源本身有 3/4 國有錯：菲律賓電話高信心錯誤、越南地址錯誤（街道）、泰國地址錯誤（樓層）+ 電話是分機非總機；只有印尼資料完全正確。

**2. 移工模式流程**：勾外籍人士→選 worker，網頁表單多出「雇主姓名/電話、仲介姓名/電話」4 個輸入框（`app/page.tsx:1586-1649`）。PDF 方面 `isForeignNational=true` 會加 3 頁：使用說明頁（`:1325`）、外籍人士資訊頁（含熱線+辦事處+移工健康中心，`:2449`）、緊急用語卡頁（`:2726`）——這 3 頁由 `isForeignNational` 觸發，與 `foreignType` 是 worker 還是 resident 無關（見 L1）。`lib/migrant-phrases.ts` 的用語卡**只在 PDF 的用語卡頁被 render**，網頁端（app/page.tsx、EmergencyCardView.tsx、/emergency）完全沒有使用，grep 全 repo 確認零命中。

**3. i18n 斷層**：確認為真，且範圍比「疑似」更大。/handbook（`app/handbook/page.tsx`）與 /emergency（`app/emergency/page.tsx`）零串接 6 語系 i18n 系統，`components/EmergencyCardView.tsx` 同樣零串接；`app/page.tsx:391` 轉頁時也沒帶語言參數，locale 狀態在離開首頁那一刻就遺失。詳見 H2。

**4. migrant-health-centers.json**：只在 PDF「外籍人士資訊頁」內顯示（`components/pdf/HandbookPDF.tsx:2644-2718`），網頁端沒有獨立呈現。只有 2 筆全國資料造成「幾乎必然顯示但通常很遠」的問題（M1），且該檔案未被 `public/sw.js` 的 `DATA_ASSETS` 快取清單納入（M2，已確認核實）。

---

## 附錄：查證方法

電話/地址查證方式：WebSearch 初篩 + WebFetch 直接讀取外交部 (mofa.gov.tw) 官方頁面全文（越南、泰國、菲律賓皆已直接 fetch 確認）；印尼因 WebFetch 憑證錯誤改用 WebSearch AI 摘要（引用 MOFA/roc-taiwan.org 為來源，信心度中高）。菲律賓緊急/ATN 專線因多來源給出不同號碼（0966-480-702 / 0966-537-732 / 02-2658-9210-9211 / 02-2658-8560），標記「查無法確認」而非直接判定錯誤，建議由人工致電 02-2658-8825 總機確認正確急難分機。
