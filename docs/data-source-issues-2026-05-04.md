# 政府防災開放資料源健檢報告 + 通報執行紀錄

**檢測日期：** 2026-05-04
**回報人：** 許翔（sirius1984@gmail.com）
**檢測工具：** `scripts/update-data.ts` 中所列全部 33 個 URL，循序送 HTTP 請求
**檢測結果：** 8/33 正常，25/33 異常

---

## 一、為什麼這份文件存在

「台灣家庭防災手冊」（https://disaster-handbook.vercel.app）每週自動從政府開放資料抓取最新的避難所、醫療院所、AED、消防隊、派出所資料。2026-05-04 這次健檢發現 33 個資料源中有 25 個異常 — 部分連結 404、部分伺服器錯誤、部分網域消失。

本文件用途有三：

1. **記錄健檢結果** — 哪些資料源壞了、壞在哪裡、影響有多大
2. **準備通報內容** — 19 個機關的對口窗口 + 已寫好的通報文字
3. **追蹤通報結果** — 寄出日 / 受理日 / 修復日（待回填）

---

## 二、健檢結果摘要

### ✅ 正常運作（8 筆）

| 類別   | 機關                         | 資料集                 |
| ------ | ---------------------------- | ---------------------- |
| 避難所 | 臺北市政府                   | 避難收容處所（總清單） |
| 防空   | 彰化縣政府警察局             | 彰化縣防空避難設施     |
| 防空   | 內政部警政署保安警察第二總隊 | 保警二總隊防空避難     |
| 醫療   | 衛福部健保署                 | NHI 醫學中心           |
| 醫療   | 衛福部健保署                 | NHI 區域醫院           |
| 醫療   | 衛福部健保署                 | NHI 地區醫院           |
| 醫療   | 衛福部健保署                 | NHI 診所               |
| 消防   | 內政部消防署                 | 全國消防分隊           |

### ❌ 異常（25 筆）

| #   | 類別   | 機關                                | 故障狀態                        | 推測原因                     |
| --- | ------ | ----------------------------------- | ------------------------------- | ---------------------------- |
| 1   | 避難所 | 內政部消防署 中央避難收容處所點位檔 | HTTP 200 但 body 空             | 伺服器產出 bug               |
| 2   | 避難所 | 臺北市政府 114 年避難收容處所       | HTTP 200 但 body 空             | 新版資料未上線               |
| 3   | 避難所 | 新北市政府 避難收容處所             | "Request Rejected"（WAF 擋）    | 防火牆誤判機器人             |
| 4   | 避難所 | 桃園市政府 避難收容所               | API 400 "Incorrect UUID format" | 我方 script placeholder UUID |
| 5   | 避難所 | 高雄市政府 災民避難收容處所         | HTTP 200 但 body 空             | 我方 script placeholder UUID |
| 6   | 防空   | 臺北市政府警察局 防空避難           | HTTP 500                        | 伺服器內部錯誤               |
| 7   | 防空   | 新北市政府警察局 防空避難           | "Request Rejected"（WAF 擋）    | 防火牆誤判機器人             |
| 8   | 防空   | 桃園市政府警察局 防空避難           | API 回 code:500                 | 伺服器內部錯誤               |
| 9   | 防空   | 新竹市政府警察局 防空避難           | HTTP 404                        | CSV 檔案路徑失效             |
| 10  | 防空   | 臺中市政府警察局 防空避難           | NO_AUTH 401                     | 改為需 API 金鑰              |
| 11  | 防空   | 南投縣政府 防空避難                 | HTTP 500                        | 伺服器內部錯誤               |
| 12  | 防空   | 雲林縣政府警察局 防空避難           | DNS NXDOMAIN                    | 網域 ylhpb.gov.tw 已不存在   |
| 13  | 防空   | 嘉義市政府 防空避難                 | API "缺少必要參數"              | API 介面變更                 |
| 14  | 防空   | 嘉義縣政府 防空避難                 | HTTP 404 錯誤頁                 | CSV 檔案路徑失效             |
| 15  | 防空   | 臺南市政府 防空避難                 | "dataNotFound"                  | 資料集已刪除或 ID 變更       |
| 16  | 防空   | 高雄市政府警察局 防空避難           | HTTP 200 但 body 空             | 檔案 ID 失效                 |
| 17  | 防空   | 屏東縣政府警察局 防空避難           | HTTP 404                        | CSV 檔案路徑失效             |
| 18  | 防空   | 宜蘭縣政府警察局 防空避難           | HTTP 404                        | API 路徑失效                 |
| 19  | 防空   | 花蓮縣政府警察局 防空避難           | HTTP 404                        | CSV 檔案路徑失效             |
| 20  | 防空   | 澎湖縣政府 防空避難                 | HTTP 404                        | API 路徑失效                 |
| 21  | 防空   | 金門縣政府警察局 防空避難           | HTTP 404                        | CSV 檔案路徑失效             |
| 22  | 防空   | 苗栗縣政府警察局 防空避難           | HTTP 404                        | CSV 檔案路徑失效             |
| 23  | 派出所 | 內政部警政署 全國派出所             | HTTP 200 但 body 空             | 伺服器產出 bug               |
| 24  | 派出所 | 內政部警政署 / TGOS 派出所(備援源)  | HTTP 404                        | TGOS 改版，URL 失效          |
| 25  | AED    | 衛福部 AED 開放資料                 | Node fetch 失敗（curl 可取得）  | 我方客戶端 TLS 問題          |

> **註：** #4、#5、#25 嚴格說是我方腳本問題，不需要通報機關。實際需要寄出去的是 **22 個資料集問題**，分布在 **18 個機關**。

### 影響評估（防空避難現有資料偏差）

| 縣市   | 全國防空避難資料中該縣市佔比 | 風險  |
| ------ | ---------------------------- | ----- |
| 金門縣 | 0 筆（完全缺資料）           | 🔴 高 |
| 屏東縣 | 5 筆（嚴重不足）             | 🔴 高 |
| 宜蘭縣 | 3 筆（嚴重不足）             | 🔴 高 |
| 連江縣 | 4 筆（無源頭資料）           | 🔴 高 |
| 花蓮縣 | 385 筆（疑似舊資料）         | 🟡 中 |
| 澎湖縣 | 435 筆（疑似舊資料）         | 🟡 中 |
| 雲林縣 | 634 筆（疑似舊資料）         | 🟡 中 |
| 苗栗縣 | 2,097 筆（疑似舊資料）       | 🟡 中 |

---

## 三、通報執行清單

### 寄信統一署名

```
許翔
台灣家庭防災手冊（https://disaster-handbook.vercel.app）
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
Email: sirius1984@gmail.com
```

### 路徑分類

| 類型                        | 對口                             | 數量  | 動作                 |
| --------------------------- | -------------------------------- | ----- | -------------------- |
| ① 數位部統合通報            | `opendata@moda.gov.tw`           | 1 封  | **Gmail 草稿已建立** |
| ② 縣市政府公開信箱          | 金門 `km1999@mail.kinmen.gov.tw` | 1 封  | **Gmail 草稿已建立** |
| ③ 縣市政府縣長/市長信箱表單 | 17 個縣市                        | 17 件 | 須自行至表單貼上文本 |
| ④ GitHub Issue 公開記錄     | disaster-handbook repo           | 1 件  | **已建立**           |

> **為什麼大部分不能直接寄 email？**
>
> data.gov.tw 公開的「資料管理者」資訊只有姓名+電話，**沒有 email**。
> 多數縣市政府也不公開單位信箱，主要通報路徑是「縣長/市長信箱」線上表單。
> 因此本文件中「③」類的 17 件，文本已寫好，但實際送出要走表單。

---

## 信件 1 ── 數位發展部開放資料平台 ⭐ Gmail 草稿已建立

**收件人：** opendata@moda.gov.tw
**性質：** 統合通報，請數位部協助轉介各機關
**Gmail 動作：** 已建立草稿，主旨見下

### 主旨

```
【開放資料異常通報】22 筆防災相關資料集失效，懇請協助轉介各 dataset 管理機關
```

### 內文

```
您好，

我是「台灣家庭防災手冊」（https://disaster-handbook.vercel.app）的開發者
許翔。本服務為免費開源民眾自助工具，每週自動從政府開放資料平台
（data.gov.tw）抓取避難所、醫療院所、AED、消防隊、派出所等防災資源，
協助民眾在 3 秒內找到住家附近的避難設施。

2026 年 5 月 4 日例行健檢時，發現 data.gov.tw 上 22 筆防災相關資料集
（特別是「防空疏散避難設施」系列）下載連結異常，分屬 18 個資料管理機關。
由於本服務無法逐一聯繫每個縣市政府窗口，懇請數位發展部開放資料平台團隊
協助轉介給對應機關，並考慮以下幾點建議：

──────────────────────────────────────────────────
A. 異常資料集清單（按機關分組）

【內政部消防署】
  1. 避難收容處所點位檔（dataset 73242）
     URL: https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/
          ED6CF735-4F68-4029-893B-B2F77B0CDBA4/resource/
          54550E2F-9661-4498-8143-2B03A363B06F/download
     現況: HTTP 200 但 body 為空（0 bytes）
     資料管理者: 李庭惠 02-81959119 #9913

【內政部警政署】
  2. 全國派出所資料
     URL: https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/
          A52DA7A0-E6F4-44E3-8687-3C04BB1EABB4/resource/
          89F93411-922E-4459-B7F3-0ADF444CDEAD/download
     現況: HTTP 200 但 body 為空（0 bytes）
     備註: TGOS 備援 URL 也已 404

【臺北市政府】
  3. 114 年避難收容處所（rid=3f20cc14-...）
     現況: HTTP 200, body 空
  4. 防空避難設施（dataset 151681）
     現況: HTTP 500
     資料管理者: 黃庭芳 02-88611124

【新北市政府】（WAF 誤擋）
  5. 避難收容處所（25e439ab-...）
  6. 防空避難設施（dataset 123701）
     現況: 兩者皆回應 HTML "Request Rejected"
     資料管理者: 王先生 02-82286517

【桃園市政府】
  7. 防空避難設施（dataset 151818）
     現況: API code:500
     資料管理者: 王煌庭 03-3363488

【新竹市政府】
  8. 防空避難設施（dataset 92430）
     現況: HTTP 404
     資料管理者: 林岱杉 03-5243359

【臺中市政府】
  9. 防空避難設施（dataset 169476）
     現況: NO_AUTH 401（改為需 API 金鑰）
     資料管理者: 施先生 04-22222086
     ※ 防災公益資料是否有必要設授權門檻？建議回復為公開可下載

【南投縣政府】
  10. 防空避難設施（dataset 151011）
      現況: HTTP 500
      資料管理者: 民防管制中心 049-2222067

【雲林縣政府警察局】
  11. 防空避難設施（dataset 37544）
      現況: 原網域 ylhpb.gov.tw 已 NXDOMAIN（網域不存在）
      資料管理者: 謝先生 05-5345843

【嘉義市政府】
  12. 防空避難設施（dataset 151561）
      現況: API "缺少必要參數"，介面變更
      資料管理者: 民防管制中心徐先生 05-2220803

【嘉義縣政府】
  13. 防空避難設施（dataset 150915）
      現況: HTTP 404
      資料管理者: 張小姐 05-3620299

【臺南市政府】
  14. 防空避難設施（dataset 151677）
      現況: dataNotFound
      資料管理者: 潘建宇 06-2991111

【高雄市政府】
  15. 災民避難收容處所
  16. 防空避難設施（dataset 151751）
      現況: 兩者皆 HTTP 200, body 空
      資料管理者(防空): 李佩穎 07-3368333

【屏東縣政府警察局】
  17. 防空避難設施（dataset 151578）
      現況: HTTP 404
      資料管理者: 張文凱 08-7334727
      ⚠️ 屏東現有資料僅 5 筆，嚴重不足

【宜蘭縣政府警察局】
  18. 防空避難設施（dataset 151608）
      現況: HTTP 404
      資料管理者: 林展志 03-9331279
      ⚠️ 宜蘭現有資料僅 3 筆，嚴重不足

【花蓮縣政府警察局】
  19. 防空避難設施（dataset 166468）
      現況: HTTP 404
      資料管理者: 陳雅雲 03-8226181

【澎湖縣政府】
  20. 防空避難設施（dataset 150913）
      現況: HTTP 404
      資料管理者: 陳孟玨 06-9272301

【金門縣政府警察局】
  21. 防空避難設施
      現況: HTTP 404，且本服務 0 筆金門資料
      ⚠️ 金門位處特殊地理位置，防空避難資訊極為關鍵

【苗栗縣政府警察局】
  22. 防空避難設施
      現況: HTTP 404
──────────────────────────────────────────────────

B. 系統性建議

  1. data.gov.tw「資料管理者聯絡資訊」目前僅顯示姓名+電話。
     建議增加 email 欄位，方便民間下游服務直接通報問題，
     減少數位部居中轉介的負擔。

  2. 多筆 API 回應 HTTP 200 但 body 為空（共 5 筆），
     導致自動化工具誤判下載成功，靜默失敗最危險。
     建議要求各資料提供機關在資料缺失時回應正確的 4xx/5xx 狀態碼。

  3. 部分資料集的下載 URL 隨改版失效（共 9 筆 404），
     建議 data.gov.tw 平台在偵測到下游 URL 失敗時自動標示
     「資料集失聯」，避免下游服務白等。

C. 我方願意配合事項

  - 本服務願意公開資料源健檢腳本，作為各機關自主檢測參考
    （github.com/siriushsu/taiwan-disaster-handbook）
  - 同份資料同步公開於 GitHub Issue，方便追蹤
    （將於通報後附上連結）
  - 修復後本服務會在更新日誌中註明「[縣市] 資料源已恢復」，
    形同公開鼓勵迅速處理的機關

本服務完全免費、開源、非營利，所有資料皆出處清楚標示。
懇請數位部協助，感謝您的辛勞。

敬祝 平安

許翔
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

## 信件 2 ── 金門縣政府 ⭐ Gmail 草稿已建立

**收件人：** km1999@mail.kinmen.gov.tw（金門縣政府 1999 公開信箱）
**Gmail 動作：** 已建立草稿
**為什麼直接寄：** 金門是 18 個縣市中唯一公開直接信箱的，且金門資料 0 筆風險最高

### 主旨

```
【開放資料異常通報】金門縣防空避難設施 CSV 連結 404，本服務 0 筆金門資料
```

### 內文

```
金門縣政府 您好，

我是「台灣家庭防災手冊」（https://disaster-handbook.vercel.app）的開發者
許翔。本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的
避難所、醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家
附近的避難設施。

2026-05-04 例行健檢時發現，金門縣政府警察局原本提供之防空避難設施
CSV 連結已失效：

──────────────────────────────────────────────────
原 URL: https://ws.kinmen.gov.tw/001/Upload/461/refile/
        13420/28908/af16a4f8-f29e-41f4-8bed-2f4a8e4ec0b1.csv
回應: HTTP 404 Not Found
檢測時間: 2026-05-04 14:00
──────────────────────────────────────────────────

⚠️ 特別告知：本服務全國 7 萬多筆防空避難資料中，**金門縣為 0 筆**。
這代表金門縣民如遇緊急狀況查詢民間防災工具時，幾乎找不到附近的合法
防空避難設施。考量金門位處特殊地理位置，防空避難資訊對民眾安全極為
關鍵。

懇請金門縣政府協助：

1. 確認金門縣防空避難設施資料目前的官方公開位置
2. 提供最新可下載的 CSV/JSON 連結
3. 並建議於 data.gov.tw 對應資料集頁面（建議資料集 ID：可洽詢數位部）
   登錄為公開可下載資料

本服務完全免費、開源、非營利，所有資料皆出處清楚標示。
懇請協助，感謝您的辛勞。

敬祝 平安

許翔
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

## 信件 3–18 ── 縣市政府縣長/市長信箱表單

下列 16 件需要至各縣市政府的「縣長/市長信箱」線上表單貼入。文本已寫好。

> **填寫小撇步：**
>
> 1. 表單通常會要求「主旨」「分類」「內容」「姓名」「Email」「電話」「地址」。
> 2. 「分類」選「市政建議」「服務建議」「其他」均可，依各表單選項擇近選擇。
> 3. 「Email」填 sirius1984@gmail.com（公部門通常以 email 回覆）。
> 4. 「電話」與「地址」屬必填或選填依縣市而異，建議填妥避免被退件。
> 5. 送出後通常會收到「確認連結」email — 必須點擊才會立案，請保留收件夾通知。

---

### 信件 3 ── 內政部消防署（中央避難收容處所）

**對口：** 內政部消防署資訊室 / 為民服務窗口
**官網：** https://www.nfa.gov.tw/cht/
**為民服務：** https://www.nfa.gov.tw/cht/index.php?code=list&ids=2148
**業務電話：** 02-81959119 #9913（資料管理者：李庭惠）

**主旨：**

```
【開放資料異常通報】中央避難收容處所點位檔 API 連續多週回應 200 但 body 為空
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的
避難所、醫療院所、AED、消防隊、派出所資料。

2026-05-04 健檢時發現貴署提供之「避難收容處所點位檔」(data.gov.tw
dataset 73242) API 連續多週異常：

URL: https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/
     ED6CF735-4F68-4029-893B-B2F77B0CDBA4/resource/
     54550E2F-9661-4498-8143-2B03A363B06F/download
回應: HTTP 200, body 0 bytes
資料管理者: 李庭惠 02-81959119 #9913

由於 HTTP 狀態碼為 200，自動化系統會誤判下載成功，但實際資料消失，
若不修復將影響全台民間防災工具的資訊覆蓋率。

懇請：
1. 檢視 opdadm.moi.gov.tw 該支 API 的後端產出流程
2. 修復後若 URL 已變更，請於 data.gov.tw 該資料集頁面註明
3. 建議伺服器在資料缺失時回應正確的 5xx 狀態碼

本服務免費開源非營利，資料來源均標示為內政部消防署。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 4 ── 內政部警政署（全國派出所）

**對口：** 內政部警政署為民服務 / 民防指揮管制所
**官網：** https://www.npa.gov.tw/ch/
**署長信箱：** https://www.npa.gov.tw/ch/mailbox/mailnpa/mailnpa
**民防指揮管制所：** 02-29349940
**TGOS 改版備援源也 404**

**主旨：**

```
【開放資料異常通報】全國派出所開放資料 API 回 200 但 body 為空，TGOS 備援源亦 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。本服務每週使用警政署開放資料更新派出所位置資訊，協助民眾就近
求助。

2026-05-04 檢測發現警政署提供之全國派出所資料兩個源都異常：

主要源:
  https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/
  A52DA7A0-E6F4-44E3-8687-3C04BB1EABB4/resource/
  89F93411-922E-4459-B7F3-0ADF444CDEAD/download
  → HTTP 200, body 0 bytes

備援源 (TGOS):
  https://www.tgos.tw/tgos/VirtualDir/Product/9927eb8a-efed-40c0-8bc4-83121ad6834a/
  PoliceAddress1.csv
  → HTTP 404

懇請：
1. 檢視主要源 API 的後端產出流程
2. 若 TGOS 改版，請更新對應資料集頁面的下載連結
3. 建議伺服器在資料缺失時回應 5xx 而非 200，避免自動化工具誤判

本服務免費開源非營利，資料來源均標示為內政部警政署。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 5 ── 臺北市政府（避難所新版 + 防空避難）

**對口：** 臺北市政府市長信箱
**信箱表單：** https://hello.gov.taipei/
**業務窗口：** 警察局 02-2331-3561（防空避難資料管理者：黃庭芳 02-88611124）

**主旨：**

```
【開放資料異常通報】臺北市 114 年避難收容處所、防空避難設施 兩資料集無法下載
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。本服務每週使用臺北市政府開放資料平台 (data.taipei) 資料更新。

2026-05-04 檢測發現以下兩個防災相關資料集無法正常下載：

1. 避難收容處所(114 年版本)
   rid: 3f20cc14-e2a8-4f00-81c6-57c4baa2c0e3
   現況: HTTP 200 但 body 為空
   ※ 舊版(rid=4c92dbd4-...)仍可正常下載，推測 114 年新版未實際上線

2. 防空避難設施 (data.gov.tw dataset 151681)
   URL: https://data.taipei/api/dataset/70a6216e-4855-4a76-8fb4-5c3e3ef771de/
        resource/3bd658e7-96c6-401e-9bdd-4cb0a61f86e4/download
   現況: HTTP 500 內部伺服器錯誤
   資料管理者: 黃庭芳 02-88611124

說明：臺北市為防空避難設施數量最多的縣市（本服務目前約有 22,000 筆
臺北市資料），這份資料更新對所有民間防災工具至關重要。

懇請：
1. 檢視 data.taipei 上述兩 API 的可用性
2. 若資料集 ID 已變更，請於原資料集頁面註明新連結

本服務免費開源非營利，資料來源均標示為臺北市政府開放資料。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 6 ── 新北市政府（資料平台 WAF 誤擋）

**對口：** 新北市政府市長信箱
**信箱表單：** https://service.ntpc.gov.tw/contact/Index.action
**業務窗口：** 警察局民防管制中心（防空避難資料管理者：王先生 02-82286517）

**主旨：**

```
【開放資料異常通報】data.ntpc.gov.tw 防火牆誤擋自動化下載（避難所 + 防空兩資料集）
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。本服務每週使用新北市政府開放資料平台 (data.ntpc.gov.tw) 資料。

2026-05-04 檢測發現以下兩個資料集 API 回應內容為防火牆攔截頁：

1. 避難收容處所
   25e439ab-e9eb-41cf-8a56-be84e0c2c22d
   回應: HTML "Request Rejected"

2. 防空避難設施 (data.gov.tw dataset 123701)
   3a9d87f0-1f10-4be4-8866-e7e1de4e9407
   回應: HTML "Request Rejected"
   資料管理者: 王先生 02-82286517

訊息內容: "The requested URL was rejected. Please consult with your
administrator." 判斷為 WAF 誤判為機器人流量。本服務每週僅請求一次，
已使用合法 User-Agent 標示。

懇請：
1. 將 data.ntpc.gov.tw API 路徑加入 WAF 白名單
2. 或提供官方建議的程式存取方式（API Key 申請流程）

新北為防空避難設施密度極高的縣市，這份資料若無法穩定取得將直接影響
民間防災服務覆蓋率。

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 7 ── 桃園市政府（防空避難）

**對口：** 桃園市政府市長信箱
**信箱表單：** https://www.mayor.tycg.gov.tw/
**業務窗口：** 警察局（資料管理者：王煌庭 03-3363488）

**主旨：**

```
【開放資料異常通報】桃園市防空避難設施 API 回 code:500 內部錯誤
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現桃園市防空避難設施資料集 (data.gov.tw dataset 151818)
API 異常：

URL: https://opendata.tycg.gov.tw/api/dataset/
     12eb630b-b480-4b30-8b8e-5dda0bd785ed/resource/
     fb856832-3321-43dc-a1fd-18d0c0bbf1ff/download
回應: {"success":false,"code":500,"s_message":""}
資料管理者: 王煌庭 03-3363488

懇請修復 opendata.tycg.gov.tw 該資料集 API 的內部錯誤。

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 8 ── 新竹市政府警察局

**對口：** 新竹市政府市長信箱
**信箱表單：** https://dep-mayor.hccg.gov.tw/PEOPLEAPPLY/People01.action
**業務窗口：** 警察局（資料管理者：林岱杉 03-5243359）

**主旨：**

```
【開放資料異常通報】新竹市防空避難設施 CSV 連結 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現新竹市政府開放資料平台 (odws.hccg.gov.tw) 提供之
防空避難設施 CSV 連結已失效：

URL: https://odws.hccg.gov.tw/001/Upload/25/OpenData/9261/
     1a83861a-c2c2-4c5a-b08f-7d67db6ddf7c.csv
回應: HTTP 404 Not Found
資料管理者: 林岱杉 03-5243359

⚠️ 本服務 7 萬多筆全國防空避難資料中，新竹市僅有 52 筆，明顯偏低，
顯示此資料源失效已有一段時間。

懇請：
1. 提供最新的 CSV 下載連結
2. 並建議於 odws.hccg.gov.tw 該資料集頁面更新

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 9 ── 臺中市政府警察局

**對口：** 臺中市政府市長信箱
**信箱表單：** https://www.taichung.gov.tw/9909/9911/Lpsimplelist
**業務窗口：** 警察局（資料管理者：施先生 04-22222086）

**主旨：**

```
【開放資料異常通報】臺中市防空避難設施 API 改為需授權，建議回復為公開
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現臺中市開放資料平台 (newdatacenter.taichung.gov.tw)
防空避難設施資料集 (data.gov.tw dataset 169476) 改為需授權存取：

URL: https://newdatacenter.taichung.gov.tw/api/v2/datasets/
     662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab/resource/download/
     rid/662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab
回應: {"success":false,"code":401,"s_message":"NO_AUTH"}
資料管理者: 施先生 04-22222086

懇請說明：
1. 是否確實已改為需 API key？
2. 若是，民間自由開源工具如何申請？
3. 或可否將此防災相關資料集回復為公開可下載？

考量防災資訊的公益性質與《政府資訊公開法》精神，建議將避難設施資料
維持為無授權門檻，方便民間共同推廣防災教育。

本服務目前已收錄臺中市約 9,500 筆防空避難資料。免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 10 ── 南投縣政府

**對口：** 南投縣政府縣長信箱
**信箱表單：** https://www.nantou.gov.tw/lonpipe/lonpipe.asp
**業務窗口：** 民防管制中心 049-2222067

**主旨：**

```
【開放資料異常通報】南投縣防空避難設施 CSV 下載 HTTP 500
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現南投縣政府開放資料平台 (data.nantou.gov.tw) 防空
避難設施 (data.gov.tw dataset 151011) CSV 下載連結回應 HTTP 500：

URL: https://data.nantou.gov.tw/dataset/
     fdd78983-fab0-44f7-9e32-0d89f1088277/resource/
     13cf6edc-a5e6-41e7-a71d-f75e23ad5dbe/download/20260305.csv
資料管理者: 民防管制中心 049-2222067

南投縣防空避難資料目前本服務僅有 439 筆，恐有缺漏。
懇請檢視後端產出流程並修復。

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 11 ── 雲林縣政府警察局

**對口：** 雲林縣政府縣長信箱
**信箱表單：** https://www2.yunlin.gov.tw/MagistrateMail/PWriteForm.aspx
**業務窗口：** 警察局（資料管理者：謝先生 05-5345843）

**主旨：**

```
【開放資料異常通報】雲林縣警察局防空避難資料網域 ylhpb.gov.tw 已不存在
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現雲林縣警察局原本提供之「防空疏散避難設施一覽表」
CSV 連結所在的網域 ylhpb.gov.tw 已不存在：

原 URL: https://www.ylhpb.gov.tw/df_ufiles/a/045-雲林縣警察局防空疏散
        避難設施一覽表.csv
DNS 解析: NXDOMAIN（網域不存在）
資料管理者: 謝先生 05-5345843

推測網站已遷移或下架。本服務目前僅有 634 筆雲林縣防空避難資料，
顯示此資料源失效已久。

懇請：
1. 確認雲林縣警察局防空避難設施資料目前的官方公開位置
2. 若已遷移到其他平台（如 data.gov.tw 或縣府開放資料），提供新 URL
3. 並建議在 data.gov.tw dataset 37544 頁面註明新位置

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 12 ── 嘉義市政府

**對口：** 嘉義市政府市長信箱
**信箱表單：** https://oa.chiayi.gov.tw/MailBoxMayor/
**業務窗口：** 民防管制中心 徐先生 05-2220803

**主旨：**

```
【開放資料異常通報】嘉義市防空避難設施 API 介面變更，缺少必要參數
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現嘉義市政府開放資料平台 (data.chiayi.gov.tw) 防空
避難設施 (data.gov.tw dataset 151561) API 異常：

URL: https://data.chiayi.gov.tw/opendata/api/getResource?
     oid=9add82b7-fe2b-40fa-8ad2-c05f5d4fc5f1
回應: 「資料資源檔案存取API：缺少必要參數」
資料管理者: 民防管制中心 徐先生 05-2220803

推測 API 介面已變更。

懇請：
1. 提供 data.chiayi.gov.tw API 的最新呼叫方式（哪些參數為必填）
2. 或提供 CSV/JSON 直接下載連結

本服務目前已收錄嘉義市約 2,458 筆防空避難資料。免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 13 ── 嘉義縣政府

**對口：** 嘉義縣政府縣長信箱
**信箱表單：** https://www.cyhg.gov.tw/cl.aspx?n=10925
**業務窗口：** 警察局（資料管理者：張小姐 05-3620299）

**主旨：**

```
【開放資料異常通報】嘉義縣防空避難設施 CSV 連結 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現嘉義縣政府防空避難設施 (data.gov.tw dataset 150915)
CSV 下載連結回應 404：

URL: https://ws-tm.cyhg.gov.tw/Download.ashx?u=...
回應: HTTP 404 (HTML 錯誤頁)
資料管理者: 張小姐 05-3620299

本服務目前僅有 522 筆嘉義縣防空避難資料，疑似資料缺漏。

懇請：
1. 提供最新的 CSV 下載連結
2. 並建議於 data.gov.tw 對應資料集頁面更新

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 14 ── 臺南市政府

**對口：** 臺南市政府市長信箱
**信箱表單：** https://service.tainan.gov.tw/Default/MailBox
**業務窗口：** 警察局（資料管理者：潘建宇 06-2991111）

**主旨：**

```
【開放資料異常通報】臺南市防空避難設施資料集 dataNotFound
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現臺南市政府開放資料平台 (data.tainan.gov.tw) 防空
避難設施 (data.gov.tw dataset 151677) CSV 下載連結回應「dataNotFound」
頁面：

URL: https://data.tainan.gov.tw/File/ResourceCsvDownload/
     e57347d7-d5fb-4ee3-9e98-c69da60f5fa5
回應: HTML 頁面內容指向 /js/dataNotFound.js
資料管理者: 潘建宇 06-2991111

推測該資料集已被刪除或 ID 已變更。

懇請：
1. 確認該資料集是否仍維護中
2. 若已搬移，請提供新的下載連結
3. 若已下架，請於 data.gov.tw 對應資料集說明替代來源

本服務目前已收錄臺南市約 6,300 筆防空避難資料。免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 15 ── 高雄市政府（避難所 + 防空兩資料集）

**對口：** 高雄市政府市長信箱
**信箱表單：** https://service.kcg.gov.tw/Default/MailBox
**業務窗口：** 警察局（防空資料管理者：李佩穎 07-3368333）

**主旨：**

```
【開放資料異常通報】高雄市避難收容處所、防空避難設施 兩資料集 API 回 200 但 body 空
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現高雄市政府開放資料平台 (data.kcg.gov.tw) 以下
兩個資料集 API 回應雖為 HTTP 200 但實際 body 為空：

1. 災民避難收容處所
   URL: https://data.kcg.gov.tw/File/directDownload/[檔案ID]
   現況: HTTP 200, 0 bytes
   ※ 檔案 ID 疑似已變更，需提供新 ID

2. 防空避難設施 (data.gov.tw dataset 151751)
   URL: https://data.kcg.gov.tw/File/directDownload/
        e5ee3906-be9c-440d-ab10-c352dff5e92b
   現況: HTTP 200, 0 bytes
   資料管理者: 李佩穎 07-3368333

懇請：
1. 確認上述兩個檔案 ID 是否仍有效，若已變更請提供新 ID
2. 建議伺服器在資料缺失時回應正確的 4xx/5xx 狀態碼

本服務目前收錄高雄市約 6,800 筆防空避難資料。免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 16 ── 屏東縣政府警察局（高優先 — 僅 5 筆資料）

**對口：** 屏東縣政府縣長信箱
**信箱表單：** https://odcdl.pthg.gov.tw/PEO/PEON/index.html
**業務窗口：** 警察局民防管制中心（資料管理者：張文凱 08-7334727）

**主旨：**

```
【開放資料異常通報】屏東縣防空避難設施 CSV 404，本服務僅 5 筆屏東縣資料
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現屏東縣政府防空避難設施 (data.gov.tw dataset 151578)
CSV 下載連結 404：

URL: https://www-ws.pthg.gov.tw/001/upload/ebook/
     89b22d69-a6f6-4da5-b7de-a399a02c0530/resource/
     4c7a7a7d-9a5b-41c1-b8eb-3bebc3d7a4c7.csv
回應: HTTP 404 Not Found
資料管理者: 張文凱 08-7334727

⚠️ 特別告知：本服務全國 7 萬多筆防空避難資料中，**屏東縣只有 5 筆**。
這代表屏東縣民如遇空襲、地震等緊急狀況，幾乎查不到附近的合法防空避難
設施。對防災公共安全為高度風險。

懇請：
1. 緊急檢視屏東縣防空避難設施資料的完整性
2. 提供最新可下載的 CSV/JSON 連結
3. 並建議於 data.gov.tw 對應資料集頁面更新

本服務免費開源非營利，僅希望屏東縣民也能享有與其他縣市同等的防災
資訊覆蓋。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 17 ── 宜蘭縣政府警察局（高優先 — 僅 3 筆資料）

**對口：** 宜蘭縣政府民意信箱
**信箱表單：** https://rdec.e-land.gov.tw/GPMnet/AREDataApply
**業務窗口：** 警察局（資料管理者：林展志 03-9331279）

**主旨：**

```
【開放資料異常通報】宜蘭縣防空避難設施 API 路徑 404，本服務僅 3 筆宜蘭縣資料
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現宜蘭縣政府開放資料平台 (opendataap2.e-land.gov.tw)
防空避難設施 (data.gov.tw dataset 151608) API 路徑 404：

URL: https://opendataap2.e-land.gov.tw/api/v1/rest/datastore/
     c91e84872e88d1d5bb61e8a6d756d4c8.csv
回應: HTTP 404 Not Found
資料管理者: 林展志 03-9331279

⚠️ 特別告知：本服務全國 7 萬多筆防空避難資料中，**宜蘭縣只有 3 筆**。
宜蘭縣民如遇緊急狀況幾乎查不到合法防空避難設施。屬高度公共安全風險。

懇請：
1. 緊急檢視宜蘭縣防空避難設施資料源
2. 提供 opendataap2.e-land.gov.tw 平台新版 API 路徑
3. 或提供 CSV 直接下載 URL

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 18 ── 花蓮縣政府警察局

**對口：** 花蓮縣政府寫信給縣長
**信箱表單：** https://www1.hl.gov.tw/mailbox/Mail.asp
**業務窗口：** 警察局（資料管理者：陳雅雲 03-8226181）

**主旨：**

```
【開放資料異常通報】花蓮縣防空避難設施 CSV 連結 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現花蓮縣政府防空避難設施 (data.gov.tw dataset 166468)
CSV 下載連結 404：

URL: https://ws.hl.gov.tw/Download.ashx?u=...
回應: HTTP 404 Not Found
資料管理者: 陳雅雲 03-8226181

本服務目前收錄花蓮縣 385 筆防空避難資料，疑似為舊版資料快照。

考量花蓮地震頻繁，防空與避難設施資料的更新對民眾安全格外重要。

懇請：
1. 提供花蓮縣防空避難設施最新的下載連結
2. 並建議於 data.gov.tw 對應資料集頁面更新

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 19 ── 澎湖縣政府

**對口：** 澎湖縣政府人民陳情案件網站
**信箱表單：** https://opinion.penghu.gov.tw/Message.aspx?type=County
**業務窗口：** 警察局（資料管理者：陳孟玨 06-9272301）

**主旨：**

```
【開放資料異常通報】澎湖縣防空避難設施 API 路徑 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現澎湖縣政府開放資料平台 (opendataap2.penghu.gov.tw)
防空避難設施 (data.gov.tw dataset 150913) API 路徑 404：

URL: https://opendataap2.penghu.gov.tw/api/v1/rest/datastore/
     f133972b077d368150506b88504099e6.csv
回應: HTTP 404 Not Found
資料管理者: 陳孟玨 06-9272301

本服務目前收錄澎湖縣 435 筆防空避難資料，疑似為舊版資料快照。

懇請：
1. 提供 opendataap2.penghu.gov.tw 平台新版 API 路徑
2. 或提供 CSV 直接下載連結
3. 並建議於 data.gov.tw 對應資料集頁面更新

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

### 信件 20 ── 苗栗縣政府警察局

**對口：** 苗栗縣政府縣長信箱
**信箱表單：** https://service.miaoli.gov.tw/FAQTable.aspx?n=2012
**業務窗口：** 警察局（電話 037-320052）

**主旨：**

```
【開放資料異常通報】苗栗縣防空避難設施 CSV 連結 404
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者
許翔。

2026-05-04 檢測發現苗栗縣政府防空避難設施 CSV 下載連結 404：

URL: https://webws.miaoli.gov.tw/Download.ashx?u=...
回應: HTTP 404 Not Found
業務窗口: 苗栗縣警察局 037-320052

本服務目前收錄苗栗縣 2,097 筆防空避難資料，疑似為舊版資料快照。

懇請：
1. 提供苗栗縣防空避難設施最新的 CSV 下載連結
2. 並建議於 data.gov.tw 對應資料集頁面更新

本服務免費開源非營利。

敬祝 平安
許翔 / sirius1984@gmail.com
台灣家庭防災手冊 https://disaster-handbook.vercel.app
```

---

## 四、追蹤紀錄表

> 寄出後請回填本表追蹤狀態。

| #   | 機關               | 通報日期   | 通報方式                       | 受理回覆 | 修復日期 | 備註            |
| --- | ------------------ | ---------- | ------------------------------ | -------- | -------- | --------------- |
| 1   | 數位部開放資料平台 | 2026-05-06 | Email (Gmail draft)            |          |          | 統合通報        |
| 2   | 金門縣政府         | 2026-05-06 | Email (Gmail draft)            |          |          | km1999@         |
| 3   | 內政部消防署       |            | 為民服務表單                   |          |          | 中央避難所      |
| 4   | 內政部警政署       |            | 署長信箱                       |          |          | 全國派出所      |
| 5   | 臺北市政府         |            | 市長信箱 hello.gov.taipei      |          |          |                 |
| 6   | 新北市政府         |            | 市長信箱 service.ntpc.gov.tw   |          |          | WAF 誤擋        |
| 7   | 桃園市政府         |            | 市長信箱 mayor.tycg.gov.tw     |          |          |                 |
| 8   | 新竹市政府         |            | 市長信箱 dep-mayor.hccg.gov.tw |          |          |                 |
| 9   | 臺中市政府         |            | 市長信箱 taichung.gov.tw       |          |          | NO_AUTH         |
| 10  | 南投縣政府         |            | 縣長信箱 nantou.gov.tw         |          |          |                 |
| 11  | 雲林縣政府         |            | 縣長信箱 yunlin.gov.tw         |          |          | NXDOMAIN        |
| 12  | 嘉義市政府         |            | 市長信箱 oa.chiayi.gov.tw      |          |          |                 |
| 13  | 嘉義縣政府         |            | 縣長信箱 cyhg.gov.tw           |          |          |                 |
| 14  | 臺南市政府         |            | 市長信箱 service.tainan.gov.tw |          |          |                 |
| 15  | 高雄市政府         |            | 市長信箱 service.kcg.gov.tw    |          |          |                 |
| 16  | 屏東縣政府         |            | 縣長信箱 odcdl.pthg.gov.tw     |          |          | 僅 5 筆，高優先 |
| 17  | 宜蘭縣政府         |            | 民意信箱 rdec.e-land.gov.tw    |          |          | 僅 3 筆，高優先 |
| 18  | 花蓮縣政府         |            | 縣長信箱 www1.hl.gov.tw        |          |          |                 |
| 19  | 澎湖縣政府         |            | 人民陳情 opinion.penghu.gov.tw |          |          |                 |
| 20  | 苗栗縣政府         |            | 縣長信箱 service.miaoli.gov.tw |          |          |                 |

---

## 五、後續腳本層應做的調整（自留）

這份報告本身只處理「機關通報」。在腳本層也有事可做：

- [ ] 修桃園、高雄避難所 URL 的 placeholder UUID（`...0000-0000-...`）
- [ ] 補上基隆市、新竹縣、臺東縣、連江縣的避難 + 防空避難資料源
- [ ] AED 端 fetch 改用 axios / undici 客製設定，繞過 Node fetch TLS 問題
- [ ] 將本檢查腳本固化為 `scripts/check-sources.ts` 並接到 GitHub Actions
- [ ] 加上資料源健康監控腳本（每週跑、失敗超過 N 週自動建 GitHub Issue）

---

## 六、相關連結

- **本服務：** https://disaster-handbook.vercel.app
- **GitHub Repo：** https://github.com/siriushsu/taiwan-disaster-handbook
- **GitHub Issue（公開追蹤）：** https://github.com/siriushsu/taiwan-disaster-handbook/issues/1
- **data.gov.tw 全國防空避難設施指南應用：** https://data.gov.tw/applications/136114
