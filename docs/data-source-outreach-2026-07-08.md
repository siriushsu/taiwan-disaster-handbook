# 政府防災開放資料源通報清單（2026-07-08）

**檢測日期：** 2026-07-08（沿用 [2026-05-04 健檢報告](./data-source-issues-2026-05-04.md) 的機關清單與聯絡資訊，本次重新查證並更新）
**回報人：** 許翔（sirius1984@gmail.com）
**重大發現：** 本次逐一比對 data.gov.tw 資料集頁面上登記的「目前下載連結」，發現 **18 個失敗源中有 14 個機關其實已經換過新的 resource URL**（政府平台每季/每次更新資料時 resource UUID 會跟著換，但我方腳本仍寫死舊 URL），只要把腳本裡的 URL 換成新的即可解決，**不需要通報**。

**2026-07-08 晚間獨立覆驗更新：** 14 個新 URL 逐一重新 curl 覆測，**13 個確認回傳真實 CSV，已套用至 `scripts/update-data.ts`**；唯獨**南投縣的新 URL 覆測仍回 HTML 錯誤頁**（下表南投列的「已測」不成立），南投改列通報名單。真正需要通報機關修復的為 **5 個**（雲林縣、嘉義縣、金門縣、苗栗縣、南投縣）。

---

## 一、總表

### 已找到新 URL、可直接修腳本解決（14 筆，不需通報）

| 縣市 | 資料集 | 今日錯誤現象 | 機關 | 聯絡窗口 | 新 URL 驗證 |
| --- | --- | --- | --- | --- | --- |
| 臺北市 | 防空避難設施 | HTTP 500 | 臺北市政府警察局 | 黃庭芳 02-88611124 aq5731@gov.taipei | ✅ 已測，2.98MB CSV，真實資料 |
| 新北市 | 防空避難設施 | 回 HTML 非 CSV | 新北市政府警察局 | 王先生 (02)82286517 e01452@ntpd.gov.tw | ✅ 已測，1.18MB CSV |
| 新北市 | 避難收容處所 | 回 HTML 非 CSV | 新北市政府社會局 | 徐瑋勵 (02)29603456#3938 AU5297@ntpc.gov.tw | ✅ 已測，172KB CSV，584 筆（另找到正確資料集 125800，5/4 報告誤引 123701 的聯絡人） |
| 桃園市 | 防空避難設施 | 0 筆 | 桃園市政府警察局 | 王煌婷 (03)336-3488 10028898@mail.tycg.gov.tw | ✅ 已測，817KB CSV |
| 桃園市 | 避難收容所（114年） | 0 筆（腳本 placeholder UUID） | 桃園市政府社會局 | 林靖璇 03-3322101#6402 10055912@mail.tycg.gov.tw | ✅ 已測，15.7MB CSV（找到真實 dataset 32259，取代腳本裡從未填入的假 UUID） |
| 新竹市 | 防空避難設施 | HTTP 404 | 新竹市政府警察局 | 林泰山 03-5243359# 412158@ems.hccg.gov.tw | ✅ 已測，310KB CSV（data.gov.tw 頁面標示 0 筆，但實際下載有真實資料） |
| 臺中市 | 防空避難設施 | 0 筆（舊源需授權） | 臺中市政府警察局 | 施先生 04-22222086 t120085@taichung.gov.tw | ✅ 已測，1.34MB CSV（新版走 no-auth 端點，不再需要 API key） |
| 南投縣 | 防空避難設施 | HTTP 500 | 南投縣政府民防管制中心 | 049-2222067 yhl@ncpb.gov.tw | ❌ 覆驗不通過：2026-07-08 晚間獨立重測，新 URL 仍回 HTML 錯誤頁（非 CSV）→ 移列下方通報名單，通報時適用第三節共用範本 |
| 嘉義市 | 防空避難設施 | 連線失敗 | 嘉義市政府民防管制中心 | 徐先生 05-2220803 mk01@mail.ccpb.gov.tw | ✅ 已測，273KB CSV（新版 URL 補上原本缺少的 rid 參數） |
| 臺南市 | 防空避難設施 | 回 HTML 非 CSV | 臺南市政府警察局 | 潘建羽 (06)2991111 panjianyu@mail.tainan.gov.tw | ✅ 已測，752KB CSV |
| 屏東縣 | 防空避難設施 | 連線失敗 | 屏東縣政府警察局民管中心 | 張文愷 08-7334727 wenkai0918@ptpolice.gov.tw | ✅ 已測，261KB CSV |
| 宜蘭縣 | 防空避難設施 | HTTP 404 | 宜蘭縣政府警察局 | 林展志 (03)933-1279 summer0114@mail.e-land.gov.tw | ✅ 已測，144KB CSV |
| 花蓮縣 | 防空避難設施 | HTTP 404 | 花蓮縣政府警察局 | 陳雅筠 038-226181 yayunchen@mail2.hlpb.gov.tw | ✅ 已測，62KB CSV（資料集本身 2023-11-24 後未再更新，內容可能偏舊，但可下載） |
| 澎湖縣 | 防空避難設施 | HTTP 404 | 澎湖縣政府警察局 | 陳孟珓 (06)927-2301 fxkq35l3@phpb.penghu.gov.tw | ✅ 已測，91KB CSV |

### 仍然壞掉、需要通報機關（5 筆）

| 縣市 | 資料集 | 今日錯誤現象 | 機關 | 聯絡窗口 | 通報管道 | 是否找到替代新 URL |
| --- | --- | --- | --- | --- | --- | --- |
| 南投縣 | 防空避難設施 | 舊 URL HTTP 500；data.gov.tw 登記的新 URL 覆測仍回 HTML 錯誤頁 | 南投縣政府民防管制中心 | 049-2222067 yhl@ncpb.gov.tw | Email + 縣長信箱 | ❌ 新 URL 覆驗失敗（適用第三節共用範本擬稿） |
| 雲林縣 | 防空避難設施 | 連線失敗（原網域 www.ylhpb.gov.tw NXDOMAIN） | 雲林縣政府警察局 | 謝先生 05-5345843 hsiehmt@mail.ylhpb.gov.tw | Email + 縣長信箱 | ⚠️ 部分找到：data.gov.tw 登記的新網域 `ws.yunlin.gov.tw` 存在，但該路徑被 Cloudflare 判定為機器人流量擋下（HTTP 403 "Attention Required"），非我方可解，需請機關協助放行或提供穩定連結 |
| 嘉義縣 | 防空避難設施 | 連線失敗 | 嘉義縣政府警察局 | 簡先生 05-3620299 7525222@m2.cypd.gov.tw | Email + 縣長信箱 | ❌ 查無：data.gov.tw 登記的新 URL 實測仍是 HTTP 404 錯誤頁 |
| 金門縣 | 防空避難設施 | 連線失敗 | 金門縣政府警察局 | 一般信箱 km1999@mail.kinmen.gov.tw（無登記資料管理者，因為 data.gov.tw／「全國防空避難設施指南」平台上根本沒有金門縣的資料集） | Email | ❌ 查無：金門縣從未在 data.gov.tw 掛牌此資料集，域名本身存活但檔案路徑 404 |
| 苗栗縣 | 防空避難設施 | HTTP 404 | 苗栗縣政府警察局 | 037-320052（無 email，查無資料管理者，因為 data.gov.tw／「全國防空避難設施指南」平台上根本沒有苗栗縣的資料集；另查到派出所名冊聯絡人蘇先生 037-322303，非本資料集專責窗口，僅供參考） | 縣長信箱 | ❌ 查無：域名本身存活但檔案路徑 404 |

---

## 二、替代 URL 清單（可直接修 `scripts/update-data.ts`）

以下為 14 個縣市的舊 URL → 新 URL 對照，已於 2026-07-08 逐一 curl 驗證下載成功（回傳真實 CSV、非 HTML 錯誤頁）。**這份清單本身只記錄查證結果，尚未套用到 `scripts/update-data.ts`——套用前建議先跑一次 `--dry-run` 確認欄位對得上，因為部分縣市（新竹市、屏東縣）CSV 的欄位標頭跟舊版不完全一樣。**

### AIR_RAID_SOURCES（防空避難設施，對照 `scripts/update-data.ts` 第 464 行起）

```
臺北市：
  舊: https://data.taipei/api/dataset/70a6216e-4855-4a76-8fb4-5c3e3ef771de/resource/3bd658e7-96c6-401e-9bdd-4cb0a61f86e4/download
  新: https://data.taipei/api/dataset/70a6216e-3730-4d1d-b334-62fca2dd71cd/resource/3bd658e7-8e8a-446b-8df5-89b2b896ff97/download

新北市：
  舊: https://data.ntpc.gov.tw/api/datasets/3a9d87f0-1f10-4be4-8866-e7e1de4e9407/csv/file
  新: https://data.ntpc.gov.tw/api/datasets/3a9d87f0-9490-4021-8fc9-5045ecdd8d22/csv/file

桃園市：
  舊: https://opendata.tycg.gov.tw/api/dataset/12eb630b-b480-4b30-8b8e-5dda0bd785ed/resource/fb856832-3321-43dc-a1fd-18d0c0bbf1ff/download
  新: https://opendata.tycg.gov.tw/api/dataset/12eb630b-9ee9-42a0-8cd7-98373aa69aad/resource/fb856832-5c4c-4b55-97a1-b7fda54f20df/download

新竹市：
  舊: https://odws.hccg.gov.tw/001/Upload/25/OpenData/9261/1a83861a-c2c2-4c5a-b08f-7d67db6ddf7c.csv
  新: https://odws.hccg.gov.tw/001/Upload/25/opendataback/9059/375/1a83861a-6b38-49a9-a2d0-6f518961e2c7.csv

臺中市：
  舊: https://newdatacenter.taichung.gov.tw/api/v2/datasets/662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab/resource/download/rid/662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab
  新: https://newdatacenter.taichung.gov.tw/api/v1/no-auth/resource.download?rid=662dbb8c-a6f8-480b-8f8d-2822363988de
  （注意：端點從 v2 需授權改為 v1 no-auth，不再需要 API key）

南投縣：
  舊: https://data.nantou.gov.tw/dataset/fdd78983-fab0-44f7-9e32-0d89f1088277/resource/13cf6edc-a5e6-41e7-a71d-f75e23ad5dbe/download/20260305.csv
  新: https://data.nantou.gov.tw/dataset/b5b34398-398b-4c75-9d7d-e2dcde1778a8/resource/79d383bf-3a20-4deb-a65f-f7b816267396/download/20260630.csv

嘉義市：
  舊: https://data.chiayi.gov.tw/opendata/api/getResource?oid=9add82b7-fe2b-40fa-8ad2-c05f5d4fc5f1
  新: https://data.chiayi.gov.tw/opendata/api/getResource?oid=9add82b7-bf09-42bb-88f7-5d63e0fd9c99&rid=c831e197-2884-4c32-bbcd-6bccae360727

臺南市：
  舊: https://data.tainan.gov.tw/File/ResourceCsvDownload/e57347d7-d5fb-4ee3-9e98-c69da60f5fa5
  新: https://data.tainan.gov.tw/File/ResourceCsvDownload/e57347d7-50a1-42f9-8d6e-44d5c787a0f3

屏東縣：
  舊: https://www-ws.pthg.gov.tw/001/upload/ebook/89b22d69-a6f6-4da5-b7de-a399a02c0530/resource/4c7a7a7d-9a5b-41c1-b8eb-3bebc3d7a4c7.csv
  新: https://www-ws.pthg.gov.tw/Upload/2015pthg/0/relfile/0/0/31a64432-7954-4738-b760-56621373875d.csv

宜蘭縣：
  舊: https://opendataap2.e-land.gov.tw/api/v1/rest/datastore/c91e84872e88d1d5bb61e8a6d756d4c8.csv
  新: https://opendataap2.e-land.gov.tw/./resource/files/2025-05-06/c91e84872e88d1d5bb61e8a6d756d4c8.csv

花蓮縣：
  舊: https://ws.hl.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNDIwL3JlbGZpbGUvMC80Mzc3MS9hYWVlYjc3Yi1mOWI0LTRiYTQtOTA2Ny1mMjYzZDQ1ODk3N2UuY3N2&n=6Iqx6JOu57ij6Ziy56m655aP5pWj6YG%2f6Zuj6Kit5pa9LmNzdg%3d%3d
  新: https://ws.hl.gov.tw/Download.ashx?u=LzAwMS9VcGxvYWQvNTE4L3JlbGZpbGUvMjI2MjkvMTQ4NTEzL2Q3NjQxMWQ1LTZiMjUtNGZiNS1iZGZjLWYyZjdlOTBiY2QxNS5jc3Y%3d&n=MC7mnKzlsYDpmLLnqbrnlo%2fmlaPpgb%2fpm6PoqK3mlr3nuL3muIXlhoot5paw5aKe57aT57ev5bqm54mIY3N2LmNzdg%3d%3d

澎湖縣：
  舊: https://opendataap2.penghu.gov.tw/api/v1/rest/datastore/f133972b077d368150506b88504099e6.csv
  新: https://opendataap2.penghu.gov.tw/./resource/files/2026-01-06/f133972b077d368150506b88504099e6.csv
```

### SHELTER_SOURCES（避難收容處所，對照 `scripts/update-data.ts` 第 308 行起）

```
新北市：
  舊: https://data.ntpc.gov.tw/api/datasets/25e439ab-e9eb-41cf-8a56-be84e0c2c22d/csv/file
  新: https://data.ntpc.gov.tw/api/datasets/25e439ab-49e7-4e5e-85ce-a25c13fd2770/csv/file

桃園市：（原本就是 placeholder UUID `34b07b8b-0000-...`，從未接到真實資料，非通報範圍，屬我方腳本債務）
  舊: https://opendata.tycg.gov.tw/api/dataset/34b07b8b-0000-0000-0000-000000000000/resource/75effe61-0000-0000-0000-000000000000/download
  新: https://opendata.tycg.gov.tw/api/dataset/247820e9-0bb6-4ff9-a34e-f1df72d8b296/resource/75effe61-01f0-412a-bb01-b29dae91324b/download
  （data.gov.tw dataset 32259「(105-114年)桃園市避難收容所」）
```

### 未在本次任務範圍內，但值得一提

- 高雄市避難收容處所（`data.kcg.gov.tw/File/directDownload/9c33d5ae-0000-...`）也是 placeholder UUID，性質與桃園市相同，屬我方腳本債務，未列入本次通報，建議另開工作處理。
- 高雄市防空避難設施（`data.kcg.gov.tw/File/directDownload/e5ee3906-...`）2026-07-08 實測回 HTTP 200 但 **0 bytes**（靜默壞掉，dry-run 不會標 ✗）——需在高雄市資料開放平台重查新資源連結，與上項一併處理。
- 屏東縣防空避難新 URL 可下載（經 curl fallback），但 CSV 是**雙語表頭且欄名含引號內換行**（`"項序\nno","類別\ncategory",...`），`scripts/update-data.ts` 的簡易 parseCSV 不支援 RFC4180 quoted newlines → 實際吃進 0 筆（乾淨跳過、無髒資料）。需改 parser 才能吃屏東資料。

---

## 三、通報範本（共用）

**主旨：**

```
【開放資料異常通報】{{資料集名稱}} 連結失效，懇請協助修復或提供新位址
```

**內文：**

```
{{機關}} 您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

本服務於 2026-05-04 例行健檢時已發現貴機關提供之「{{資料集名稱}}」資料下載
連結異常，並嘗試等待自然修復；2026-07-08 再次檢測，問題依然存在：

──────────────────────────────────────────────────
資料集：{{資料集名稱}}（data.gov.tw dataset {{dataset_id}}）
URL：{{URL}}
現況：{{錯誤現象}}
檢測時間：2026-05-04、2026-07-08（兩次皆異常，已持續逾兩個月）
資料管理者（data.gov.tw 登記）：{{聯絡窗口}}
──────────────────────────────────────────────────

{{附加說明}}

懇請：
1. 檢視上述連結的可用性，若資料集 ID 或路徑已變更，請於 data.gov.tw
   對應資料集頁面更新為最新連結
2. 若貴機關的防空避難設施資料尚未於 data.gov.tw 掛牌，建議一併上架，
   除了解決本服務串接問題外，也能提升資料在其他防災應用的能見度

本服務完全免費、開源、非營利，所有資料皆出處清楚標示為貴機關。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

## 四、每機關草稿（仍需通報的 5 個機關）

### 草稿 1 ── 雲林縣政府警察局

**收件人：** hsiehmt@mail.ylhpb.gov.tw（謝先生，05-5345843）
**備援管道：** 雲林縣政府縣長信箱 https://www2.yunlin.gov.tw/MagistrateMail/PWriteForm.aspx

**主旨：**

```
【開放資料異常通報】雲林縣防空疏散避難設施一覽表連結持續異常（原網域已停用，新網域被防火牆擋下）
```

**內文：**

```
雲林縣政府警察局 您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

2026-05-04 健檢時發現貴局原提供之防空疏散避難設施 CSV 連結，其所在網域
www.ylhpb.gov.tw 已完全不存在（DNS NXDOMAIN）。2026-07-08 再次檢測發現
問題仍未解決，且更進一步查證：

──────────────────────────────────────────────────
資料集：雲林縣警察局防空疏散避難設施一覽表（data.gov.tw dataset 37544）
data.gov.tw 目前登記之新連結：
  https://ws.yunlin.gov.tw/Download.ashx?u=...（詳見 data.gov.tw 資料集頁面）
現況：該連結所在網域 ws.yunlin.gov.tw 本身可連線，但此下載路徑被
      Cloudflare 判定為機器人流量，回應 HTTP 403「Attention Required」，
      本服務的自動化更新程式無法通過驗證取得資料
檢測時間：2026-05-04（原網域 NXDOMAIN）、2026-07-08（新網域 Cloudflare 擋下）
資料管理者（data.gov.tw 登記）：謝先生 05-5345843
──────────────────────────────────────────────────

懇請：
1. 確認 ws.yunlin.gov.tw 是否為官方正式的新資料位置
2. 若是，懇請將此開放資料下載路徑加入 Cloudflare 白名單／機器人驗證豁免
   清單，或提供不經過人機驗證的直接下載連結（例如另一組不受 WAF 保護的
   靜態檔案 URL）
3. 若非官方新位置，懇請提供正確的公開下載連結

本服務目前雲林縣防空避難資料筆數明顯偏低，顯示此資料源失效已有一段時間，
影響雲林縣民透過本服務查詢住家附近防空避難設施的完整性。

本服務完全免費、開源、非營利，所有資料皆出處清楚標示為貴局。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

### 草稿 2 ── 嘉義縣政府警察局

**收件人：** 7525222@m2.cypd.gov.tw（簡先生，05-3620299）
**備援管道：** 嘉義縣政府縣長信箱 https://www.cyhg.gov.tw/cl.aspx?n=10925

**主旨：**

```
【開放資料異常通報】嘉義縣防空疏散避難設施連結持續異常（含 data.gov.tw 登記之新連結）
```

**內文：**

```
嘉義縣政府警察局 您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

2026-05-04 健檢時發現貴局防空疏散避難設施 CSV 下載連結回應 HTTP 404。
2026-07-08 再次檢測，且進一步查證 data.gov.tw 資料集頁面目前登記的
連結，結果仍然異常：

──────────────────────────────────────────────────
資料集：嘉義縣防空疏散避難設施（data.gov.tw dataset 150915）
舊連結：https://ws-tm.cyhg.gov.tw/Download.ashx?u=...
data.gov.tw 目前登記之新連結：
  https://ws-tm.cyhg.gov.tw/001/Upload/1330/relfile/13620/252901/
  fc53db76-3b96-4f07-8fcf-da8233401d93.csv
現況：新舊連結皆回應 HTTP 404（自訂錯誤頁）
檢測時間：2026-05-04、2026-07-08（皆異常）
資料管理者（data.gov.tw 登記）：簡先生 05-3620299
──────────────────────────────────────────────────

由於 data.gov.tw 資料集頁面上登記的連結本身也已失效，推測後端檔案已被
移動或刪除，但頁面資訊尚未同步更新。

懇請：
1. 提供目前防空避難設施資料的正確下載位置
2. 更新 data.gov.tw dataset 150915 頁面上的下載連結，避免其他下游服務
   同樣撲空

本服務免費開源非營利，資料來源均標示為貴局。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

### 草稿 3 ── 金門縣政府（延續 5/4 已建立之 Gmail 草稿收件人）

**收件人：** km1999@mail.kinmen.gov.tw（金門縣政府 1999 公開信箱）
**為什麼沒有「資料管理者」窗口：** 查證「全國防空避難設施指南」（data.gov.tw/applications/136114）與 data.gov.tw 平台，金門縣從未掛牌防空避難設施資料集，因此沒有登記的資料管理者姓名/電話/email 可查——這點本身就是本次通報要點之一。

**主旨：**

```
【開放資料異常通報】金門縣防空避難設施連結持續失效，且貴縣資料從未於 data.gov.tw 掛牌
```

**內文：**

```
金門縣政府 您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

2026-05-04 健檢時發現貴局原本提供的防空避難設施 CSV 連結已失效
（HTTP 404），並已於同日致信通報。2026-07-08 再次檢測，問題依然存在：

──────────────────────────────────────────────────
原 URL: https://ws.kinmen.gov.tw/001/Upload/461/refile/13420/28908/
        af16a4f8-f29e-41f4-8bed-2f4a8e4ec0b1.csv
回應: HTTP 404 Not Found（網域本身可正常連線，僅此檔案路徑失效）
檢測時間: 2026-05-04、2026-07-08（連續兩次檢測皆異常，已逾兩個月）
──────────────────────────────────────────────────

此外，本次通報時進一步查證發現：金門縣的防空避難設施資料**從未在
data.gov.tw 政府資料開放平台或「全國防空避難設施指南」應用程式中掛牌**
（其他 17 個縣市皆有登記資料集頁面，僅金門縣缺席）。這代表除了本服務
之外，任何依賴 data.gov.tw 的下游防災應用都無法取得金門縣的防空避難
資訊。

⚠️ 特別告知：本服務全國 7 萬多筆防空避難資料中，**金門縣為 0 筆**。
考量金門位處特殊地理位置，防空避難資訊對民眾安全極為關鍵，這個資料
缺口的風險相當高。

懇請金門縣政府協助：

1. 確認金門縣防空避難設施資料目前的官方公開位置，提供最新可下載的
   CSV/JSON 連結
2. 將此資料集正式登錄至 data.gov.tw 政府資料開放平台，讓包含本服務
   在內的民間防災工具都能穩定取得

本服務完全免費、開源、非營利，所有資料皆出處清楚標示。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

### 草稿 4 ── 苗栗縣政府警察局

**收件人：** 無 email，走縣長信箱 https://service.miaoli.gov.tw/FAQTable.aspx?n=2012
**電話備援：** 苗栗縣政府警察局 037-320052
**為什麼沒有「資料管理者」窗口：** 同金門縣，苗栗縣防空避難設施資料從未在 data.gov.tw／「全國防空避難設施指南」掛牌。查到另一支電話 037-322303（蘇先生）來自苗栗縣警察局「派出所名冊」資料集聯絡人，非本資料集專責窗口，僅供表單填寫時參考，不作為主要聯絡對象。

**主旨：**

```
【開放資料異常通報】苗栗縣防空疏散避難設施連結失效，且貴縣資料從未於 data.gov.tw 掛牌
```

**內文：**

```
您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

2026-05-04 健檢時發現苗栗縣防空避難設施 CSV 下載連結回應 HTTP 404。
2026-07-08 再次檢測，問題依然存在：

──────────────────────────────────────────────────
URL: https://webws.miaoli.gov.tw/Download.ashx?u=...
回應: HTTP 404 Not Found（網域本身可正常連線，僅此檔案路徑失效）
檢測時間: 2026-05-04、2026-07-08（連續兩次檢測皆異常，已逾兩個月）
業務窗口: 苗栗縣政府警察局 037-320052
──────────────────────────────────────────────────

此外，本次通報時進一步查證發現：苗栗縣的防空避難設施資料**從未在
data.gov.tw 政府資料開放平台或「全國防空避難設施指南」應用程式中掛牌**
（其他多數縣市皆有登記資料集頁面，苗栗縣缺席）。

本服務目前收錄苗栗縣約 2,097 筆防空避難資料，疑似為舊版資料快照，
若原始連結持續失效，這批舊資料將無法再更新。

懇請苗栗縣政府協助：

1. 提供苗栗縣防空避難設施最新的 CSV/JSON 下載連結
2. 將此資料集正式登錄至 data.gov.tw 政府資料開放平台

本服務免費開源非營利，資料來源均標示為貴局。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

### 草稿 5 ── 南投縣政府（民防管制中心）

**收件人：** yhl@ncpb.gov.tw（南投縣政府民防管制中心，049-2222067）
**備援管道：** 南投縣政府縣民服務信箱 https://www.nantou.gov.tw
**背景：** 2026-07-08 晚間獨立覆驗——舊連結 HTTP 500、南投縣資料開放平台登記的新連結也回 HTML 錯誤頁，兩組皆無法取得資料，故列入通報。

**主旨：**

```
【開放資料異常通報】南投縣防空疏散避難設施下載連結持續異常（新舊連結皆無法取得資料）
```

**內文：**

```
南投縣政府民防管制中心 您好，

我是「台灣家庭防災手冊」(https://disaster-handbook.vercel.app) 的開發者許翔。
本服務為免費開源民眾自助工具，每週自動從政府開放資料抓取最新的避難所、
醫療院所、AED、消防隊、派出所資料，協助民眾在 3 秒內找到住家附近的避難設施。

本服務 2026-05-04 例行健檢時即發現貴縣防空疏散避難設施資料下載異常；
2026-07-08 再次檢測，新舊兩組連結皆無法取得資料：

──────────────────────────────────────────────────
資料集：南投縣防空疏散避難設施（南投縣政府資料開放平台）
舊連結：https://data.nantou.gov.tw/dataset/fdd78983-fab0-44f7-9e32-0d89f1088277/
        resource/13cf6edc-a5e6-41e7-a71d-f75e23ad5dbe/download/20260305.csv
  → 回應 HTTP 500
平台目前登記之新連結：
  https://data.nantou.gov.tw/dataset/b5b34398-398b-4c75-9d7d-e2dcde1778a8/
  resource/79d383bf-3a20-4deb-a65f-f7b816267396/download/20260630.csv
  → 回應 HTML 錯誤頁（非 CSV 檔案內容）
檢測時間：2026-05-04、2026-07-08（皆異常）
資料管理者（平台登記）：049-2222067 yhl@ncpb.gov.tw
──────────────────────────────────────────────────

由於平台頁面上登記的最新連結本身也無法下載，推測為平台端檔案或路由問題。

懇請：
1. 檢視上述連結的可用性，提供目前防空避難設施資料的正確下載位置
2. 修復後同步更新資料開放平台頁面上的下載連結，避免其他下游服務同樣撲空

本服務完全免費、開源、非營利，所有資料皆出處清楚標示為貴府。
懇請協助，感謝您的辛勞。

敬祝 平安

（寄件人姓名）
台灣家庭防災手冊 https://disaster-handbook.vercel.app
GitHub: https://github.com/siriushsu/taiwan-disaster-handbook
sirius1984@gmail.com
```

---

## 五、間歇性失敗（列入觀察，不通報）

- **衛福部 AED 開放資料**：`tw-aed.mohw.gov.tw` 偶發連線失敗，curl 重試通常可取得，屬伺服器不穩定而非資料消失，暫不通報。
- **警政署全國派出所**：7/6 cron 失敗、7/8 手動重跑成功，同屬間歇性，暫不通報。

---

## 六、追蹤紀錄表（待回填）

| # | 機關 | 通報日期 | 通報方式 | 受理回覆 | 修復日期 | 備註 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 雲林縣政府警察局 | 待寄出（compose 連結已備） | Email + 縣長信箱 | | | Cloudflare 擋下自動化請求 |
| 2 | 嘉義縣政府警察局 | 待寄出（compose 連結已備） | Email + 縣長信箱 | | | data.gov.tw 登記新連結也 404 |
| 3 | 金門縣政府 | 待寄出（compose 連結已備，取代 5/6 舊草稿） | Email | | | 從未於 data.gov.tw 掛牌，0 筆風險最高 |
| 4 | 苗栗縣政府警察局 | 待使用者手動送出 | 縣長信箱網頁表單 | | | 從未於 data.gov.tw 掛牌；表單 https://service.miaoli.gov.tw/FAQTable.aspx?n=2012 |
| 5 | 南投縣政府民防管制中心 | 待寄出（compose 連結已備） | Email | | | 新舊連結皆異常（7/8 覆驗確認） |

> 2026-07-08 註：通報信一律由 **sirius1984@gmail.com** 寄出。當日曾誤將 4 封草稿建入
> Gmail connector 綁定的公司帳號（已提供刪除清單），改以 Gmail compose 深連結頁
> （預填收件人/主旨/內文、指向 sirius1984 帳號）由使用者親自寄出。公司帳號草稿匣內
> 另有 5/6 誤建的 2 封舊草稿（金門舊版、數位發展部 22 筆總通報——內容已過時，14 筆
> 已於 7/8 自行解決）一併待刪。

---

## 七、相關連結

- **本服務：** https://disaster-handbook.vercel.app
- **GitHub Repo：** https://github.com/siriushsu/taiwan-disaster-handbook
- **5/4 健檢報告：** [`docs/data-source-issues-2026-05-04.md`](./data-source-issues-2026-05-04.md)
- **全國防空避難設施指南應用：** https://data.gov.tw/applications/136114
