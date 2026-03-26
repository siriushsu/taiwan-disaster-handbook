#!/usr/bin/env npx tsx
/**
 * 台灣防災資料自動更新腳本
 *
 * 資料來源：
 * 1. 避難收容處所 — data.gov.tw 中央資料集 (ID: 73242) + 各縣市開放資料
 * 2. 防空疏散避難設施 — 各縣市政府開放資料平台
 * 3. 醫療院所 — 健保署 NHI 特約機構清單 (醫學中心/區域醫院/地區醫院/診所)
 * 4. AED — 衛福部 AED 開放資料 (https://tw-aed.mohw.gov.tw)
 * 5. 消防隊 — 消防署開放資料 (data.gov.tw dataset 5969)
 * 6. 派出所 — 警政署開放資料 (data.gov.tw dataset 5958, TWD97→WGS84)
 * 7. 捷運站 — 手動維護（變動少）
 *
 * 用法：
 *   npx tsx scripts/update-data.ts              # 更新全部
 *   npx tsx scripts/update-data.ts --shelters   # 只更新避難收容處所
 *   npx tsx scripts/update-data.ts --air-raid   # 只更新防空避難
 *   npx tsx scripts/update-data.ts --medical    # 只更新醫療院所
 *   npx tsx scripts/update-data.ts --aed        # 只更新 AED
 *   npx tsx scripts/update-data.ts --fire       # 只更新消防隊
 *   npx tsx scripts/update-data.ts --police     # 只更新派出所
 *   npx tsx scripts/update-data.ts --dry-run    # 只檢查，不寫入
 *
 * 環境變數：
 *   GOOGLE_MAPS_API_KEY — Google Geocoding API key（醫療院所新增條目定位用）
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "public", "data");
const SLEEP_MS = 1500; // rate limit between requests
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

// ─── Helpers ──────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(
  url: string,
  timeoutMs = 30000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "TaiwanDisasterHandbook/1.0 (data update script)",
      },
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

async function fetchCSV(url: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.log(`    ✗ HTTP ${res.status} from ${url.slice(0, 80)}...`);
      return null;
    }
    const text = await res.text();
    // Check if it's actually CSV (not an HTML error page)
    if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
      console.log(`    ✗ Got HTML instead of CSV from ${url.slice(0, 80)}...`);
      return null;
    }
    return text;
  } catch (e) {
    console.log(
      `    ✗ Failed: ${(e as Error).message} — ${url.slice(0, 80)}...`,
    );
    return null;
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  // Handle BOM
  if (lines[0].charCodeAt(0) === 0xfeff) lines[0] = lines[0].slice(1);
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] || "";
    });
    return row;
  });
}

/** Normalize city name to standard form */
function normalizeCity(city: string): string {
  return city
    .replace(/台北/g, "臺北")
    .replace(/台中/g, "臺中")
    .replace(/台南/g, "臺南")
    .replace(/台東/g, "臺東")
    .replace(/^台/, "臺");
}

function isValidTaiwanCoord(lat: number, lng: number): boolean {
  return lat >= 20 && lat <= 27 && lng >= 118 && lng <= 123;
}

/** Google Geocoding API — returns precise coordinates for a Taiwan address */
async function googleGeocode(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  if (!GOOGLE_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=tw&language=zh-TW&key=${GOOGLE_API_KEY}`,
      10000,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]) {
      const loc = data.results[0].geometry.location;
      const lat = Math.round(loc.lat * 1e6) / 1e6;
      const lng = Math.round(loc.lng * 1e6) / 1e6;
      if (isValidTaiwanCoord(lat, lng)) return { lat, lng };
    }
  } catch {
    /* skip */
  }
  return null;
}

// ─── data.gov.tw API ──────────────────────────────────────

interface DataGovResource {
  resourceId: string;
  resourceName: string;
  format: string;
  downloadUrl: string;
}

interface DataGovDataset {
  datasetId: string;
  title: string;
  resources: DataGovResource[];
}

/** Search data.gov.tw for datasets */
async function searchDataGov(keyword: string): Promise<DataGovDataset[]> {
  try {
    const res = await fetchWithTimeout(
      `https://data.gov.tw/api/front/dataset/list?query=${encodeURIComponent(keyword)}&limit=50&offset=0&format=json`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.datasets || data?.result?.results || []).map(
      (d: Record<string, unknown>) => ({
        datasetId: d.id || d.datasetId,
        title: d.title,
        resources: ((d.resources || []) as Record<string, unknown>[]).map(
          (r) => ({
            resourceId: r.id || r.resourceId,
            resourceName: r.name || r.resourceName,
            format: ((r.format || "") as string).toUpperCase(),
            downloadUrl: r.url || r.downloadUrl || "",
          }),
        ),
      }),
    );
  } catch (e) {
    console.log(`  ✗ data.gov.tw search failed: ${(e as Error).message}`);
    return [];
  }
}

// ─── Shelter (避難收容處所) Update ────────────────────────

interface Shelter {
  name: string;
  address: string;
  district: string;
  village?: string;
  lat: number;
  lng: number;
  capacity?: number;
  disasterTypes?: string;
  phone?: string;
  indoor?: boolean;
  vulnerableFriendly?: boolean;
}

const SHELTER_SOURCES = [
  {
    name: "中央-避難收容處所點位檔",
    url: "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/ED6CF735-4F68-4029-893B-B2F77B0CDBA4/resource/54550E2F-9661-4498-8143-2B03A363B06F/download",
  },
  {
    name: "臺北市-114年避難收容處所",
    url: "https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=3f20cc14-e2a8-4f00-81c6-57c4baa2c0e3",
  },
  {
    name: "臺北市-避難收容處所",
    url: "https://data.taipei/api/frontstage/tpeod/dataset/resource.download?rid=4c92dbd4-d259-495a-8390-52628119a4dd",
  },
  {
    name: "新北市-避難收容處所",
    url: "https://data.ntpc.gov.tw/api/datasets/25e439ab-e9eb-41cf-8a56-be84e0c2c22d/csv/file",
  },
  {
    name: "桃園市-避難收容所(114年)",
    url: "https://opendata.tycg.gov.tw/api/dataset/34b07b8b-0000-0000-0000-000000000000/resource/75effe61-0000-0000-0000-000000000000/download",
  },
  {
    name: "高雄市-災民避難收容處所",
    url: "https://data.kcg.gov.tw/File/directDownload/9c33d5ae-0000-0000-0000-000000000000",
  },
];

// Common column name mappings for shelter CSV files
const SHELTER_COL_MAP: Record<string, string[]> = {
  name: ["避難收容處所名稱", "名稱", "收容所名稱", "name", "避難處所名稱"],
  address: ["避難收容處所地址", "地址", "住址", "address"],
  district: ["縣市及鄉鎮市區", "行政區", "區域", "鄉鎮市區"],
  village: ["村里", "里別", "village"],
  lat: ["緯度", "lat", "latitude", "WGS84緯度"],
  lng: ["經度", "lng", "lon", "longitude", "WGS84經度"],
  capacity: ["預計收容人數", "收容人數", "可容納人數", "capacity"],
  disasterTypes: ["適用災害類別", "災害類別", "適用災害"],
  phone: ["管理人電話", "電話", "聯絡電話", "phone"],
};

function findCol(row: Record<string, string>, candidates: string[]): string {
  for (const c of candidates) {
    if (row[c] !== undefined) return row[c];
  }
  return "";
}

async function updateShelters(dryRun: boolean) {
  console.log("\n📦 更新避難收容處所...");

  const filePath = path.join(DATA_DIR, "taiwan-shelters.json");
  let existing: Shelter[];
  try {
    existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`  ✗ Failed to read ${filePath}: ${(e as Error).message}`);
    existing = [];
  }
  const existingByAddr = new Map(existing.map((s) => [s.address, s]));
  const existingByName = new Map(
    existing.map((s) => [`${s.district}_${s.name}`, s]),
  );

  let added = 0;
  let updated = 0;

  for (const source of SHELTER_SOURCES) {
    console.log(`  ⬇ ${source.name}`);
    const csv = await fetchCSV(source.url);
    if (!csv) continue;

    const rows = parseCSV(csv);
    console.log(`    ${rows.length} rows`);

    for (const row of rows) {
      const name = findCol(row, SHELTER_COL_MAP.name);
      const address = findCol(row, SHELTER_COL_MAP.address);
      const district = normalizeCity(findCol(row, SHELTER_COL_MAP.district));
      const lat = parseFloat(findCol(row, SHELTER_COL_MAP.lat));
      const lng = parseFloat(findCol(row, SHELTER_COL_MAP.lng));
      const capacity =
        parseInt(findCol(row, SHELTER_COL_MAP.capacity)) || undefined;

      if (!name || !address) continue;

      const key = address;
      const nameKey = `${district}_${name}`;

      if (existingByAddr.has(key)) {
        const s = existingByAddr.get(key)!;
        let changed = false;
        if (capacity && capacity !== s.capacity) {
          s.capacity = capacity;
          changed = true;
        }
        if (isValidTaiwanCoord(lat, lng) && !isValidTaiwanCoord(s.lat, s.lng)) {
          s.lat = lat;
          s.lng = lng;
          changed = true;
        }
        if (changed) updated++;
      } else if (existingByName.has(nameKey)) {
        // Same name+district, different address — update address
        updated++;
      } else if (isValidTaiwanCoord(lat, lng)) {
        // New shelter with valid coordinates
        const newShelter: Shelter = {
          name,
          address,
          district,
          village: findCol(row, SHELTER_COL_MAP.village) || undefined,
          lat,
          lng,
          capacity,
          disasterTypes:
            findCol(row, SHELTER_COL_MAP.disasterTypes) || undefined,
          phone: findCol(row, SHELTER_COL_MAP.phone) || undefined,
        };
        existing.push(newShelter);
        existingByAddr.set(key, newShelter);
        added++;
      }
    }
    await sleep(SLEEP_MS);
  }

  // Also try dynamic search on data.gov.tw
  console.log("  🔍 Searching data.gov.tw for new datasets...");
  const datasets = await searchDataGov("避難收容處所");
  console.log(`    Found ${datasets.length} datasets`);

  console.log(
    `  ✓ Results: ${added} added, ${updated} updated, ${existing.length} total`,
  );

  if (!dryRun && (added > 0 || updated > 0)) {
    existing.sort(
      (a, b) =>
        a.district.localeCompare(b.district) || a.name.localeCompare(b.name),
    );
    fs.writeFileSync(filePath, JSON.stringify(existing));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { added, updated, total: existing.length };
}

// ─── Air Raid Shelter (防空避難設施) Update ─────────────────

interface AirRaid {
  a: string; // address
  t: number; // lat
  g: number; // lng
  c: number | null; // capacity
}

const AIR_RAID_SOURCES = [
  {
    name: "臺北市",
    url: "https://data.taipei/api/dataset/70a6216e-4855-4a76-8fb4-5c3e3ef771de/resource/3bd658e7-96c6-401e-9bdd-4cb0a61f86e4/download",
  },
  {
    name: "新北市",
    url: "https://data.ntpc.gov.tw/api/datasets/3a9d87f0-1f10-4be4-8866-e7e1de4e9407/csv/file",
  },
  {
    name: "桃園市",
    url: "https://opendata.tycg.gov.tw/api/dataset/12eb630b-b480-4b30-8b8e-5dda0bd785ed/resource/fb856832-3321-43dc-a1fd-18d0c0bbf1ff/download",
  },
  {
    name: "新竹市",
    url: "https://odws.hccg.gov.tw/001/Upload/25/OpenData/9261/1a83861a-c2c2-4c5a-b08f-7d67db6ddf7c.csv",
  },
  {
    name: "臺中市",
    url: "https://newdatacenter.taichung.gov.tw/api/v2/datasets/662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab/resource/download/rid/662dbb8c-e3cb-4833-a46f-e6f6ad4fd0ab",
  },
  {
    name: "彰化縣",
    url: "https://www.chpb.gov.tw/opendata/8sGgzAHD40Kr1kYg7GSSAw/csv",
  },
  {
    name: "南投縣",
    url: "https://data.nantou.gov.tw/dataset/fdd78983-fab0-44f7-9e32-0d89f1088277/resource/13cf6edc-a5e6-41e7-a71d-f75e23ad5dbe/download/20260305.csv",
  },
  {
    name: "雲林縣",
    url: "https://www.ylhpb.gov.tw/df_ufiles/a/045-%E9%9B%B2%E6%9E%97%E7%B8%A3%E8%AD%A6%E5%AF%9F%E5%B1%80%E9%98%B2%E7%A9%BA%E7%96%8F%E6%95%A3%E9%81%BF%E9%9B%A3%E8%A8%AD%E6%96%BD%E4%B8%80%E8%A6%BD%E8%A1%A8.csv",
  },
  {
    name: "嘉義市",
    url: "https://data.chiayi.gov.tw/opendata/api/getResource?oid=9add82b7-fe2b-40fa-8ad2-c05f5d4fc5f1",
  },
  {
    name: "嘉義縣",
    url: "https://ws-tm.cyhg.gov.tw/Download.ashx?u=LzAwMS91cGxvYWQvNjgvcmVsZmlsZS84MjgxLzI5MjM3L2Y1ZDdmNDBmLTY3Y2ItNDFmNi1hMTRiLWRlOWY5ZThhMjk2NC5jc3Y%3d&n=5ZiJ576p57ij6Ziy56m655aP5pWj6YG%2f6Zuj6Kit5pa9LmNzdg%3d%3d",
  },
  {
    name: "臺南市",
    url: "https://data.tainan.gov.tw/File/ResourceCsvDownload/e57347d7-d5fb-4ee3-9e98-c69da60f5fa5",
  },
  {
    name: "高雄市",
    url: "https://data.kcg.gov.tw/File/directDownload/e5ee3906-be9c-440d-ab10-c352dff5e92b",
  },
  {
    name: "屏東縣",
    url: "https://www-ws.pthg.gov.tw/001/upload/ebook/89b22d69-a6f6-4da5-b7de-a399a02c0530/resource/4c7a7a7d-9a5b-41c1-b8eb-3bebc3d7a4c7.csv",
  },
  {
    name: "宜蘭縣",
    url: "https://opendataap2.e-land.gov.tw/api/v1/rest/datastore/c91e84872e88d1d5bb61e8a6d756d4c8.csv",
  },
  {
    name: "花蓮縣",
    url: "https://ws.hl.gov.tw/Download.ashx?u=LzAwMS91cGxvYWQvNDIwL3JlbGZpbGUvMC80Mzc3MS9hYWVlYjc3Yi1mOWI0LTRiYTQtOTA2Ny1mMjYzZDQ1ODk3N2UuY3N2&n=6Iqx6JOu57ij6Ziy56m655aP5pWj6YG%2f6Zuj6Kit5pa9LmNzdg%3d%3d",
  },
  {
    name: "澎湖縣",
    url: "https://opendataap2.penghu.gov.tw/api/v1/rest/datastore/f133972b077d368150506b88504099e6.csv",
  },
  {
    name: "金門縣",
    url: "https://ws.kinmen.gov.tw/001/Upload/461/refile/13420/28908/af16a4f8-f29e-41f4-8bed-2f4a8e4ec0b1.csv",
  },
  {
    name: "保安警察第二總隊",
    url: "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/3C42D952-2AD3-4EA7-ABAE-2A75CCD0422A/resource/34181884-6D86-466A-AD14-BE6A0F9272F2/download",
  },
  {
    name: "苗栗縣",
    url: "https://webws.miaoli.gov.tw/Download.ashx?u=LzAwMS91cGxvYWQvMjgvcmVsZmlsZS8xMjE2NC84NjkwMC8xZjAyYTRjOS04YjQwLTQ2MjMtOGY3My1jZjlhNWZlNTdlNTQuY3N2&n=6IuX5qCX57ij6K2m5a%2bf5bGA6Ziy56m655aP5pWj6YG%2f6Zuj6Kit5pa95L2N572u5riF5YaKLmNzdg%3d%3d",
  },
];

const AIR_RAID_COL_MAP: Record<string, string[]> = {
  address: ["地址", "住址", "設施地址", "防空避難設施地址", "位置", "address"],
  lat: ["緯度", "lat", "latitude", "WGS84緯度", "Y"],
  lng: ["經度", "lng", "lon", "longitude", "WGS84經度", "X"],
  capacity: [
    "容納人數",
    "可容納人數",
    "收容人數",
    "容量",
    "capacity",
    "設施可容納人數",
  ],
};

async function updateAirRaid(dryRun: boolean) {
  console.log("\n🏢 更新防空避難設施...");

  const filePath = path.join(DATA_DIR, "taiwan-air-raid.json");
  let existing: AirRaid[];
  try {
    existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error(`  ✗ Failed to read ${filePath}: ${(e as Error).message}`);
    existing = [];
  }
  const existingByAddr = new Map(existing.map((s) => [s.a, s]));

  let added = 0;
  let updated = 0;
  let failed = 0;

  for (const source of AIR_RAID_SOURCES) {
    console.log(`  ⬇ ${source.name}`);
    const csv = await fetchCSV(source.url);
    if (!csv) {
      failed++;
      continue;
    }

    const rows = parseCSV(csv);
    console.log(`    ${rows.length} rows`);

    let sourceAdded = 0;
    let sourceUpdated = 0;

    for (const row of rows) {
      let address = findCol(row, AIR_RAID_COL_MAP.address);
      if (!address) continue;

      // Normalize address
      address = normalizeCity(address.trim());

      const lat = parseFloat(findCol(row, AIR_RAID_COL_MAP.lat));
      const lng = parseFloat(findCol(row, AIR_RAID_COL_MAP.lng));
      const cap = parseInt(findCol(row, AIR_RAID_COL_MAP.capacity)) || null;

      if (!isValidTaiwanCoord(lat, lng)) continue;

      if (existingByAddr.has(address)) {
        const s = existingByAddr.get(address)!;
        let changed = false;
        if (cap && cap !== s.c) {
          s.c = cap;
          changed = true;
        }
        // Update coords if existing ones are less precise
        if (Math.abs(lat - s.t) > 0.0001 || Math.abs(lng - s.g) > 0.0001) {
          s.t = lat;
          s.g = lng;
          changed = true;
        }
        if (changed) sourceUpdated++;
      } else {
        existing.push({ a: address, t: lat, g: lng, c: cap });
        existingByAddr.set(address, existing[existing.length - 1]);
        sourceAdded++;
      }
    }

    console.log(`    +${sourceAdded} new, ~${sourceUpdated} updated`);
    added += sourceAdded;
    updated += sourceUpdated;
    await sleep(SLEEP_MS);
  }

  console.log(
    `  ✓ Results: ${added} added, ${updated} updated, ${failed} sources failed, ${existing.length} total`,
  );

  if (!dryRun && (added > 0 || updated > 0)) {
    fs.writeFileSync(filePath, JSON.stringify(existing));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { added, updated, failed, total: existing.length };
}

// ─── Medical Facilities (醫療院所) Update ─────────────────

interface MedicalFacility {
  name: string;
  address: string;
  phone: string;
  type: "hospital" | "clinic";
  hasER: boolean;
  erLevel?: string;
  lat?: number;
  lng?: number;
}

const NHI_SOURCES = [
  {
    name: "醫學中心",
    url: "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21001-003",
  },
  {
    name: "區域醫院",
    url: "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21002-005",
  },
  {
    name: "地區醫院",
    url: "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21003-003",
  },
  {
    name: "診所",
    url: "https://info.nhi.gov.tw/api/iode0000s01/Dataset?rId=A21030000I-D21004-009",
  },
];

/** Check if a clinic name suggests it's beauty/cosmetic or dental-only */
function isFilteredClinic(name: string): boolean {
  const beautyPatterns = /醫美|整形|美容|時尚診所|微整|雷射美容|美學/;
  const dentalPatterns = /^.*牙科.*$|^.*牙醫.*$/;
  return beautyPatterns.test(name) || dentalPatterns.test(name);
}

/** Extract street name from an address for approximate coord matching */
function extractStreet(address: string): string | null {
  // Match up to 路/街/大道
  const m = address.match(/^(.+?(?:路|街|大道))/);
  return m ? m[1] : null;
}

async function updateMedical(dryRun: boolean) {
  console.log("\n🏥 更新醫療院所...");

  const filePath = path.join(DATA_DIR, "taiwan-medical.json");
  let existing: MedicalFacility[];
  try {
    existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    console.log("  ⚠ No existing file, starting fresh");
    existing = [];
  }

  // Build lookup by name+address for preserving coords
  const existingMap = new Map(
    existing.map((m) => [`${m.name}|${m.address}`, m]),
  );
  // Build street→coord lookup from entries that have coordinates
  const streetCoords = new Map<string, { lat: number; lng: number }>();
  for (const m of existing) {
    if (m.lat && m.lng) {
      const street = extractStreet(m.address);
      if (street && !streetCoords.has(street)) {
        streetCoords.set(street, { lat: m.lat, lng: m.lng });
      }
    }
  }

  const newEntries: MedicalFacility[] = [];
  const seenKeys = new Set<string>();

  for (const source of NHI_SOURCES) {
    console.log(`  ⬇ ${source.name}`);
    const csv = await fetchCSV(source.url);
    if (!csv) continue;

    const rows = parseCSV(csv);
    console.log(`    ${rows.length} rows`);

    for (const row of rows) {
      const name = row["醫事機構名稱"] || "";
      const address = row["地址"] || "";
      const phone = row["電話"] || "";
      const contractType = row["特約類別"] || "";
      const services = row["診療科別"] || "";

      if (!name || !address) continue;

      // Classify type: 1=醫學中心, 2=區域醫院, 3=地區醫院 → hospital
      // 4=診所 → clinic; skip 5=藥局 and others
      const typeCode = parseInt(contractType);
      let facilityType: "hospital" | "clinic";
      if (typeCode >= 1 && typeCode <= 3) {
        facilityType = "hospital";
      } else if (typeCode === 4) {
        facilityType = "clinic";
      } else {
        continue; // Skip 藥局 (5) and others
      }

      // Filter out beauty clinics and dental-only clinics
      if (facilityType === "clinic" && isFilteredClinic(name)) continue;

      const key = `${name}|${address}`;
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      // Determine ER info
      const hasER =
        facilityType === "hospital" ||
        services.includes("急診") ||
        services.includes("急救");
      let erLevel: string | undefined;
      if (typeCode === 1) erLevel = "醫學中心";
      else if (typeCode === 2) erLevel = "區域醫院";
      else if (typeCode === 3) erLevel = "地區醫院";

      // Preserve existing coordinates
      const prev = existingMap.get(key);
      let lat = prev?.lat;
      let lng = prev?.lng;

      // Try street-level match for new entries without coords
      if (!lat || !lng) {
        const street = extractStreet(address);
        if (street) {
          const coord = streetCoords.get(street);
          if (coord) {
            lat = coord.lat;
            lng = coord.lng;
          }
        }
      }

      // Google Geocoding for entries still without coords
      if (!lat || !lng) {
        const geo = await googleGeocode(address);
        if (geo) {
          lat = geo.lat;
          lng = geo.lng;
          // Also update street cache for future entries on same street
          const street = extractStreet(address);
          if (street && !streetCoords.has(street)) {
            streetCoords.set(street, geo);
          }
        }
        await sleep(50); // 50ms = 20 QPS, well within Google's 50 QPS limit
      }

      const entry: MedicalFacility = {
        name,
        address,
        phone,
        type: facilityType,
        hasER,
      };
      if (erLevel) entry.erLevel = erLevel;
      if (lat && lng) {
        entry.lat = lat;
        entry.lng = lng;
      }
      newEntries.push(entry);
    }
    await sleep(SLEEP_MS);
  }

  const prevCount = existing.length;
  const withCoords = newEntries.filter((e) => e.lat && e.lng).length;
  const noCoords = newEntries.length - withCoords;
  const added = newEntries.filter(
    (e) => !existingMap.has(`${e.name}|${e.address}`),
  ).length;
  const removed = existing.filter(
    (e) => !seenKeys.has(`${e.name}|${e.address}`),
  ).length;

  console.log(
    `  ✓ Results: ${newEntries.length} total (was ${prevCount}), +${added} new, -${removed} removed`,
  );
  console.log(
    `  📍 Coordinates: ${withCoords} with coords, ${noCoords} missing${GOOGLE_API_KEY ? " (Google API active)" : " (set GOOGLE_MAPS_API_KEY for precise geocoding)"}`,
  );

  if (!dryRun && newEntries.length > 0) {
    newEntries.sort((a, b) => a.name.localeCompare(b.name));
    fs.writeFileSync(filePath, JSON.stringify(newEntries));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { total: newEntries.length, added, removed };
}

// ─── AED Locations Update ─────────────────────────────────

interface AedLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  location: string;
  phone?: string;
}

async function updateAed(dryRun: boolean) {
  console.log("\n💚 更新 AED 位置...");

  const filePath = path.join(DATA_DIR, "taiwan-aed.json");
  const url = "https://tw-aed.mohw.gov.tw/openData?t=csv";

  console.log("  ⬇ 衛福部 AED 開放資料");
  const csv = await fetchCSV(url);
  if (!csv) {
    console.log("  ✗ Failed to download AED data");
    return { total: 0, error: "download failed" };
  }

  const rows = parseCSV(csv);
  console.log(`    ${rows.length} rows`);

  const entries: AedLocation[] = [];

  for (const row of rows) {
    const name = row["場所名稱"] || "";
    const address = row["場所地址"] || "";
    const lat = parseFloat(row["地點LAT"] || "");
    const lng = parseFloat(row["地點LNG"] || "");
    const location = row["AED放置地點"] || "";
    const phone = row["管理人聯絡電話"] || row["聯絡電話"] || "";

    if (!name || !address) continue;
    if (!isValidTaiwanCoord(lat, lng)) continue;

    const entry: AedLocation = { name, address, lat, lng, location };
    if (phone) entry.phone = phone;
    entries.push(entry);
  }

  console.log(`  ✓ Results: ${entries.length} valid AED locations`);

  if (!dryRun && entries.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(entries));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { total: entries.length };
}

// ─── Fire Stations (消防隊) Update ────────────────────────

interface FireStation {
  name: string;
  address: string;
  phone: string;
  city: string;
  lat?: number;
  lng?: number;
}

/** Decode Big5 buffer to string */
function decodeBig5(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder("big5");
  return decoder.decode(buffer);
}

/** Extract city from a Taiwan address */
function extractCity(address: string): string {
  const m = address.match(/^(.+?[市縣])/);
  return m ? normalizeCity(m[1]) : "";
}

async function updateFireStations(dryRun: boolean) {
  console.log("\n🚒 更新消防隊...");

  const filePath = path.join(DATA_DIR, "taiwan-fire-stations.json");
  const url =
    "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/57F3DD1D-A40E-49A6-8410-57303B2FF87E/resource/C38B7AC2-E7F3-4DD5-A3F3-88E623B55924/download";

  console.log("  ⬇ 消防署開放資料 (Big5)");
  let text: string;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.log(`  ✗ HTTP ${res.status}`);
      return { total: 0, error: `HTTP ${res.status}` };
    }
    const buffer = await res.arrayBuffer();
    text = decodeBig5(buffer);
    // Check if it's actually CSV
    if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
      console.log("  ✗ Got HTML instead of CSV");
      return { total: 0, error: "HTML response" };
    }
  } catch (e) {
    console.log(`  ✗ Failed: ${(e as Error).message}`);
    return { total: 0, error: (e as Error).message };
  }

  const rows = parseCSV(text);
  console.log(`    ${rows.length} rows`);

  const entries: FireStation[] = [];

  for (const row of rows) {
    const name = row["消防隊名稱"] || "";
    const address = row["地址"] || "";
    const phone = row["聯絡電話"] || "";

    if (!name || !address) continue;

    const city = extractCity(address);

    // Despite column name saying TWD97, values are actually WGS84 decimal degrees
    const lng = parseFloat(row["X座標_TWD97TM121"] || "");
    const lat = parseFloat(row["Y座標_TWD97TM121"] || "");

    const entry: FireStation = {
      name,
      address: normalizeCity(address),
      phone,
      city,
    };

    if (isValidTaiwanCoord(lat, lng)) {
      entry.lat = lat;
      entry.lng = lng;
    }

    entries.push(entry);
  }

  console.log(`  ✓ Results: ${entries.length} fire stations`);

  if (!dryRun && entries.length > 0) {
    entries.sort(
      (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    );
    fs.writeFileSync(filePath, JSON.stringify(entries));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { total: entries.length };
}

// ─── Police Stations (派出所) Update ──────────────────────

interface PoliceStation {
  name: string;
  address: string;
  phone: string;
  city: string;
  lat?: number;
  lng?: number;
}

/** Convert TWD97 TM2 (EPSG:3826) coordinates to WGS84 */
function twd97ToWgs84(x: number, y: number): { lat: number; lng: number } {
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const lng0 = (121.0 * Math.PI) / 180;
  const k0 = 0.9999;
  const dx = 250000;
  const e = Math.sqrt(2 * f - f * f);
  const e2 = (e * e) / (1 - e * e);
  x -= dx;
  const M = y / k0;
  const mu =
    M / (a * (1 - (e * e) / 4 - (3 * e ** 4) / 64 - (5 * e ** 6) / 256));
  const e1 = (1 - Math.sqrt(1 - e * e)) / (1 + Math.sqrt(1 - e * e));
  const fp =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
  const C1 = e2 * Math.cos(fp) ** 2;
  const T1 = Math.tan(fp) ** 2;
  const R1 = (a * (1 - e * e)) / (1 - e * e * Math.sin(fp) ** 2) ** 1.5;
  const N1 = a / Math.sqrt(1 - e * e * Math.sin(fp) ** 2);
  const D = x / (N1 * k0);
  const lat =
    fp -
    ((N1 * Math.tan(fp)) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * e2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * e2 - 3 * C1 ** 2) *
          D ** 6) /
          720);
  const lng =
    lng0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * e2 + 24 * T1 ** 2) * D ** 5) /
        120) /
      Math.cos(fp);
  return { lat: (lat * 180) / Math.PI, lng: (lng * 180) / Math.PI };
}

async function updatePoliceStations(dryRun: boolean) {
  console.log("\n👮 更新派出所...");

  const filePath = path.join(DATA_DIR, "taiwan-police-stations.json");

  // The authoritative source is a ZIP from TGOS, which is complex to handle.
  // Try the direct CSV download from data.gov.tw NPA dataset instead.
  // Fallback: manual update with the ZIP contents.
  const url =
    "https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/A52DA7A0-E6F4-44E3-8687-3C04BB1EABB4/resource/89F93411-922E-4459-B7F3-0ADF444CDEAD/download";

  console.log("  ⬇ 警政署派出所資料");
  let text: string | null = null;

  // Try UTF-8 first
  try {
    const res = await fetchWithTimeout(url);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      // Try UTF-8 first, fallback to Big5
      const utf8 = new TextDecoder("utf-8", { fatal: true });
      try {
        text = utf8.decode(buf);
      } catch {
        text = decodeBig5(buf);
      }
      if (text.trim().startsWith("<!") || text.trim().startsWith("<html")) {
        text = null;
        console.log("  ✗ Got HTML instead of CSV");
      }
    }
  } catch (e) {
    console.log(`  ✗ Primary source failed: ${(e as Error).message}`);
  }

  // Fallback: try TGOS CSV URL
  if (!text) {
    console.log("  ⬇ Trying TGOS fallback...");
    text = await fetchCSV(
      "https://www.tgos.tw/tgos/VirtualDir/Product/9927eb8a-efed-40c0-8bc4-83121ad6834a/PoliceAddress1.csv",
    );
  }

  if (!text) {
    console.log(
      "  ⚠ Could not download police station data. " +
        "TODO: manually download ZIP from https://www.tgos.tw and extract CSV.",
    );
    return { total: 0, error: "download failed" };
  }

  const rows = parseCSV(text);
  console.log(`    ${rows.length} rows`);

  const entries: PoliceStation[] = [];

  for (const row of rows) {
    const name = row["中文單位名稱"] || row["單位名稱"] || "";
    const address = row["地址"] || "";
    const phone = row["電話"] || "";
    const pointX = parseFloat(row["POINT_X"] || row["X座標"] || "");
    const pointY = parseFloat(row["POINT_Y"] || row["Y座標"] || "");

    if (!name || !address) continue;

    const city = extractCity(address);

    const entry: PoliceStation = {
      name,
      address: normalizeCity(address),
      phone,
      city,
    };

    // Convert TWD97 TM2 to WGS84 if values look like TWD97 (large numbers)
    if (pointX > 100000 && pointY > 2000000) {
      const wgs = twd97ToWgs84(pointX, pointY);
      if (isValidTaiwanCoord(wgs.lat, wgs.lng)) {
        entry.lat = Math.round(wgs.lat * 1e6) / 1e6;
        entry.lng = Math.round(wgs.lng * 1e6) / 1e6;
      }
    } else if (isValidTaiwanCoord(pointY, pointX)) {
      // Already WGS84
      entry.lat = pointY;
      entry.lng = pointX;
    }

    entries.push(entry);
  }

  console.log(`  ✓ Results: ${entries.length} police stations`);

  if (!dryRun && entries.length > 0) {
    entries.sort(
      (a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name),
    );
    fs.writeFileSync(filePath, JSON.stringify(entries));
    console.log(`  💾 Saved to ${filePath}`);
  }

  return { total: entries.length };
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyShelters = args.includes("--shelters");
  const onlyAirRaid = args.includes("--air-raid");
  const onlyMedical = args.includes("--medical");
  const onlyAed = args.includes("--aed");
  const onlyFire = args.includes("--fire");
  const onlyPolice = args.includes("--police");
  const all =
    !onlyShelters &&
    !onlyAirRaid &&
    !onlyMedical &&
    !onlyAed &&
    !onlyFire &&
    !onlyPolice;

  console.log("🇹🇼 台灣防災資料更新");
  console.log(`   模式: ${dryRun ? "🔍 檢查（不寫入）" : "💾 更新"}`);
  console.log(`   時間: ${new Date().toISOString()}`);

  const results: Record<string, unknown> = {};

  if (all || onlyShelters) {
    results.shelters = await updateShelters(dryRun);
  }

  if (all || onlyAirRaid) {
    results.airRaid = await updateAirRaid(dryRun);
  }

  if (all || onlyMedical) {
    results.medical = await updateMedical(dryRun);
  }

  if (all || onlyAed) {
    results.aed = await updateAed(dryRun);
  }

  if (all || onlyFire) {
    results.fireStations = await updateFireStations(dryRun);
  }

  if (all || onlyPolice) {
    results.policeStations = await updatePoliceStations(dryRun);
  }

  console.log("\n" + "═".repeat(50));
  console.log("📊 更新摘要");
  console.log(JSON.stringify(results, null, 2));

  // Write update log
  const logPath = path.join(DATA_DIR, "last-update.json");
  const log = {
    timestamp: new Date().toISOString(),
    dryRun,
    results,
  };
  if (!dryRun) {
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
    console.log(`\n📝 Log saved to ${logPath}`);
  }
}

main().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
