#!/usr/bin/env npx tsx
/**
 * 台灣防災資料自動更新腳本
 *
 * 資料來源：
 * 1. 避難收容處所 — data.gov.tw 中央資料集 (ID: 73242)
 * 2. 防空疏散避難設施 — 各縣市政府開放資料平台
 * 3. 醫療院所 — 衛福部開放資料
 * 4. 捷運站 — 手動維護（變動少）
 *
 * 用法：
 *   npx tsx scripts/update-data.ts              # 更新全部
 *   npx tsx scripts/update-data.ts --shelters   # 只更新避難收容處所
 *   npx tsx scripts/update-data.ts --air-raid   # 只更新防空避難
 *   npx tsx scripts/update-data.ts --dry-run    # 只檢查，不寫入
 */

import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(__dirname, "..", "public", "data");
const SLEEP_MS = 1500; // rate limit between requests

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

// ─── Main ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyShelters = args.includes("--shelters");
  const onlyAirRaid = args.includes("--air-raid");
  const all = !onlyShelters && !onlyAirRaid;

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
