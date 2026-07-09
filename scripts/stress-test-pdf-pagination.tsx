/**
 * Stress-test render: three data scenarios that stress page overflow, to
 * verify no card/box is split across pages (every atomic block in
 * HandbookPDF.tsx must carry wrap={false}; section titles minPresenceAhead).
 * Run after any change to components/pdf/HandbookPDF.tsx:
 *   npx tsx scripts/stress-test-pdf-pagination.tsx
 * then open the three PDFs it writes and eyeball every page.
 */
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import HandbookPDF from "@/components/pdf/HandbookPDF";
import type { HandbookData, Member, EmergencyContact, Shelter } from "@/types";

const OUT_DIR = path.join(os.tmpdir(), "handbook-pagination-stress");

/* Shelters with every optional field set — max card height (reproduces the
   2026-7-8 user PDF where the backup callout split across pages 3/4). */
function fullShelter(i: number): Shelter {
  return {
    name: `測試避難收容所第${i}號國民小學`,
    address: `新北市中和區立人街${i * 7}號（活動中心二樓禮堂）`,
    lat: 24.99 + i * 0.002,
    lng: 121.52 + i * 0.002,
    capacity: 1000 + i * 317,
    type: "natural_disaster",
    phone: `02-2248-26${(88 + i).toString()}＃28${i}`,
    distance: 400 + i * 180,
    disasterTypes: "水災,震災,土石流,海嘯",
    indoor: true,
    vulnerableFriendly: true,
  };
}

const baseLocation = {
  label: "主住家",
  address: "新北市永和區成功路二段193號",
  city: "新北市",
  district: "永和區",
  housingType: "apartment" as const,
  floor: "8",
  geo: {
    lat: 24.99647,
    lng: 121.52667,
    formattedAddress: "新北市永和區成功路二段193號",
  },
  shelters: [1, 2, 3, 4, 5].map(fullShelter),
  airRaid: [1, 2, 3].map((i) => ({
    name: `成功路二段${180 + i}號地下室`,
    address: `新北市永和區民本里成功路二段${180 + i}號`,
    lat: 24.99 + i * 0.001,
    lng: 121.52,
    type: "air_defense" as const,
    distance: 6 + i * 12,
    indoor: true,
  })),
  medical: [1, 2, 3].map((i) => ({
    name: `測試醫療診所第${i}號`,
    address: `新北市永和區成功路２段１３${i}號１樓`,
    lat: 24.99,
    lng: 121.52 + i * 0.001,
    type: "clinic" as const,
    hasER: false,
    phone: `(02)8921007${i}`,
    distance: 190 + i * 4,
  })),
  aed: [1, 2].map((i) => ({
    name: `遠百企業股份有限公司永和分公司${i}`,
    address: `新北市永和區中山路一段${i}號`,
    lat: 24.99,
    lng: 121.51,
    location: "B1客服中心",
    phone: "02-1234-5678",
    distance: 560 + i * 25,
  })),
};

function mkMember(name: string, extra: Partial<Member> = {}): Member {
  return {
    name,
    phone: "0912-345-678",
    birthYear: 1985,
    bloodType: "O",
    isMobilityImpaired: false,
    hasChronic: false,
    medications: "",
    allergies: "",
    specialNeeds: "",
    dailyLocation: "",
    dailyCity: "",
    dailyDistrict: "",
    dailyAddress: "",
    hasDifferentAddress: false,
    city: "",
    district: "",
    address: "",
    ...extra,
  };
}

const contacts: EmergencyContact[] = [
  {
    name: "陳外婆",
    relation: "外婆",
    phone: "07-123-4567",
    phoneBackup: "0933-111-222",
    isOutOfCity: true,
    address: "高雄市左營區",
  },
  {
    name: "王叔叔",
    relation: "叔叔",
    phone: "0988-123-456",
    phoneBackup: "0911-222-333",
    isOutOfCity: false,
  },
  {
    name: "林阿姨",
    relation: "阿姨",
    phone: "0977-888-999",
    phoneBackup: "",
    isOutOfCity: true,
  },
];

const baseHousehold = {
  address: "成功路二段193號",
  city: "新北市",
  district: "永和區",
  housingType: "apartment" as const,
  floor: "8",
  hasPets: false,
  petInfo: "",
  hasInfant: false,
  infantInfo: "",
  isForeignNational: false,
  foreignType: "" as const,
  nationality: "",
  employerName: "",
  employerPhone: "",
  brokerName: "",
  brokerPhone: "",
  members: [] as Member[],
  contacts: [] as EmergencyContact[],
};

/* Scenario 1 — reproduces the user's 2026-7-8 PDF: minimal form fill,
   full shelter data. Previously split the backup callout (p3/p4) and the
   hand-drawn box (p5/p6). */
const minimal: HandbookData = {
  household: { ...baseHousehold },
  locations: [baseLocation],
  generatedAt: "2026/7/9",
};

/* Scenario 2 — big family, all medical fields, infant + pets, one member
   with a different address (second location page pair). Stresses reunion,
   member overview (pCards + wallet card), supply checklist. */
const bigFamily: HandbookData = {
  household: {
    ...baseHousehold,
    hasInfant: true,
    infantInfo: "8個月大",
    hasPets: true,
    petInfo: "柴犬一隻",
    members: [
      mkMember("王建民", {
        medications: "高血壓藥（脈優5mg，每日一次）",
        hasChronic: true,
        dailyLocation: "信義區上班",
      }),
      mkMember("陳美麗", {
        allergies: "青黴素、磺胺類抗生素",
        dailyLocation: "大安區上班",
      }),
      mkMember("王小明", { birthYear: 2015, dailyLocation: "信義國小上學" }),
      mkMember("王小華", { birthYear: 2019, allergies: "堅果、蝦蟹" }),
      mkMember("王爺爺", {
        birthYear: 1948,
        isMobilityImpaired: true,
        hasChronic: true,
        medications: "糖尿病藥（每日兩次）、心臟病藥",
        specialNeeds: "輪椅、助聽器",
      }),
      mkMember("王奶奶", {
        birthYear: 1952,
        hasChronic: true,
        medications: "骨質疏鬆藥",
        hasDifferentAddress: true,
        city: "台北市",
        district: "文山區",
        address: "木柵路一段100號",
      }),
    ],
    contacts,
  },
  locations: [
    baseLocation,
    {
      ...baseLocation,
      label: "王奶奶住處",
      memberName: "王奶奶",
      address: "台北市文山區木柵路一段100號",
      city: "台北市",
      district: "文山區",
    },
  ],
  generatedAt: "2026/7/9",
};

/* Scenario 3 — foreign national, bilingual mode (doubles text height on
   every page), employer/broker, migrant health centers. */
const foreignBi: HandbookData = {
  household: {
    ...baseHousehold,
    isForeignNational: true,
    foreignType: "worker" as const,
    nationality: "VN", // must be a FOREIGN_RESOURCES code, not a label — else the embassy block silently drops out
    employerName: "台灣電子股份有限公司",
    employerPhone: "02-2345-6789",
    brokerName: "宏福人力仲介",
    brokerPhone: "02-8765-4321",
    members: [
      mkMember("NGUYEN VAN A", { medications: "胃藥", allergies: "海鮮" }),
      mkMember("TRAN THI B", {}),
    ],
    contacts: contacts.slice(0, 2),
  },
  locations: [
    {
      ...baseLocation,
      migrantHealthCenters: [1, 2, 3].map((i) => ({
        name: `新住民健康服務中心第${i}站`,
        city: "新北市",
        address: `新北市永和區永和路一段${i * 50}號`,
        lat: 24.99 + i * 0.001,
        lng: 121.51,
        phone: `02-2232-11${i}0`,
        distance: 800 + i * 200,
        hours: "週一至週五 09:00-17:00",
      })),
    },
  ],
  generatedAt: "2026/7/9",
};

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const scenarios: { name: string; data: HandbookData; biMode: "zh" | "bi" }[] =
    [
      { name: "s1-minimal", data: minimal, biMode: "zh" },
      { name: "s2-bigfamily", data: bigFamily, biMode: "zh" },
      { name: "s3-foreign-bi", data: foreignBi, biMode: "bi" },
    ];
  for (const sc of scenarios) {
    const buf = await renderToBuffer(
      createElement(HandbookPDF, {
        data: sc.data,
        biMode: sc.biMode,
      }) as ReactElement<DocumentProps>,
    );
    const out = path.join(OUT_DIR, `${sc.name}.pdf`);
    await writeFile(out, buf);
    console.log(`✓ ${sc.name}: ${(buf.length / 1024).toFixed(0)} KB → ${out}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
