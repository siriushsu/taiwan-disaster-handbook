/**
 * Build-time PDF preview generator.
 *
 * Renders the first page (cover) of HandbookPDF with a fixed Taipei-Xinyi
 * sample household, then rasterizes the cover (page 1) and shelter page
 * (page 4) to `public/pdf-preview-cover.png` and `public/pdf-preview-map.png`.
 * Run manually after any PDF visual change:
 *   npm run gen:pdf-preview
 */
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { writeFile, rename, unlink, mkdtemp, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import HandbookPDF from "@/components/pdf/HandbookPDF";
import type { HandbookData, Member, EmergencyContact } from "@/types";

const execFileP = promisify(execFile);

const members: Member[] = [
  {
    name: "王建民",
    phone: "0912-345-678",
    birthYear: 1985,
    bloodType: "O",
    isMobilityImpaired: false,
    hasChronic: false,
    medications: "",
    allergies: "",
    specialNeeds: "",
    dailyLocation: "信義區上班",
    dailyCity: "台北市",
    dailyDistrict: "信義區",
    dailyAddress: "信義路五段7號",
    hasDifferentAddress: false,
    city: "",
    district: "",
    address: "",
  },
  {
    name: "陳美麗",
    phone: "0923-456-789",
    birthYear: 1987,
    bloodType: "A",
    isMobilityImpaired: false,
    hasChronic: false,
    medications: "",
    allergies: "",
    specialNeeds: "",
    dailyLocation: "大安區上班",
    dailyCity: "台北市",
    dailyDistrict: "大安區",
    dailyAddress: "",
    hasDifferentAddress: false,
    city: "",
    district: "",
    address: "",
  },
  {
    name: "王小明",
    phone: "",
    birthYear: 2015,
    bloodType: "O",
    isMobilityImpaired: false,
    hasChronic: false,
    medications: "",
    allergies: "",
    specialNeeds: "",
    dailyLocation: "信義國小上學",
    dailyCity: "台北市",
    dailyDistrict: "信義區",
    dailyAddress: "",
    hasDifferentAddress: false,
    city: "",
    district: "",
    address: "",
  },
  {
    name: "王小華",
    phone: "",
    birthYear: 2019,
    bloodType: "A",
    isMobilityImpaired: false,
    hasChronic: false,
    medications: "",
    allergies: "堅果",
    specialNeeds: "",
    dailyLocation: "信義區幼兒園",
    dailyCity: "台北市",
    dailyDistrict: "信義區",
    dailyAddress: "",
    hasDifferentAddress: false,
    city: "",
    district: "",
    address: "",
  },
];

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
    phoneBackup: "",
    isOutOfCity: false,
  },
];

const sample: HandbookData = {
  household: {
    address: "信義路五段7號",
    city: "台北市",
    district: "信義區",
    housingType: "apartment",
    floor: "8",
    hasPets: false,
    petInfo: "",
    hasInfant: false,
    infantInfo: "",
    isForeignNational: false,
    foreignType: "",
    nationality: "",
    employerName: "",
    employerPhone: "",
    brokerName: "",
    brokerPhone: "",
    members,
    contacts,
  },
  locations: [
    {
      label: "主住家",
      address: "台北市信義區信義路五段7號",
      city: "台北市",
      district: "信義區",
      housingType: "apartment",
      floor: "8",
      geo: {
        lat: 25.0336,
        lng: 121.5645,
        formattedAddress: "台北市信義區信義路五段7號",
      },
      shelters: [
        {
          name: "信義國小",
          address: "台北市信義區松隆路111號",
          lat: 25.0445,
          lng: 121.5722,
          capacity: 1200,
          type: "natural_disaster",
          phone: "02-2767-1637",
          distance: 320,
          disasterTypes: "水災,震災",
          indoor: true,
          vulnerableFriendly: true,
        },
      ],
      airRaid: [
        {
          name: "台北世貿中心地下停車場",
          address: "台北市信義區信義路五段5號",
          lat: 25.0329,
          lng: 121.5628,
          type: "air_defense",
          distance: 150,
          indoor: true,
        },
      ],
      medical: [
        {
          name: "台北市立聯合醫院忠孝院區",
          address: "台北市南港區同德路87號",
          lat: 25.0432,
          lng: 121.6125,
          type: "hospital",
          hasER: true,
          erLevel: "中度",
          phone: "02-2786-1288",
          distance: 2400,
        },
      ],
    },
  ],
  generatedAt: "2026/4/25",
};

async function main() {
  console.log("→ Rendering HandbookPDF to buffer...");
  const pdfBuffer = await renderToBuffer(
    createElement(HandbookPDF, {
      data: sample,
      biMode: "zh",
    }) as ReactElement<DocumentProps>,
  );
  console.log(`  PDF size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "pdf-preview-"));
  const pdfPath = path.join(tmpDir, "handbook.pdf");
  await writeFile(pdfPath, pdfBuffer);

  // Rasterize cover (P1) and shelter/map page (P4) into two separate PNGs so
  // the homepage can show both page types side by side.
  const targets: { page: number; out: string }[] = [
    { page: 1, out: "public/pdf-preview-cover.png" },
    { page: 4, out: "public/pdf-preview-map.png" },
  ];
  for (const t of targets) {
    console.log(`→ Rasterizing page ${t.page} via pdftoppm...`);
    const prefix = path.join(tmpDir, `p${t.page}`);
    try {
      await execFileP("pdftoppm", [
        "-png",
        "-r",
        "150",
        "-f",
        String(t.page),
        "-l",
        String(t.page),
        pdfPath,
        prefix,
      ]);
    } catch (err) {
      throw new Error(
        "pdftoppm failed. Install poppler: `brew install poppler` (macOS) or equivalent.\n" +
          (err instanceof Error ? err.message : String(err)),
      );
    }
    const produced = (await readdir(tmpDir)).find(
      (f) => f.startsWith(`p${t.page}-`) && f.endsWith(".png"),
    );
    if (!produced)
      throw new Error(`pdftoppm produced no PNG for page ${t.page}`);
    const outPath = path.resolve(t.out);
    await rename(path.join(tmpDir, produced), outPath);
    console.log(`  ✓ Wrote ${outPath}`);
  }
  await unlink(pdfPath);
}

main().catch((err) => {
  console.error("Failed to generate PDF preview:", err);
  process.exit(1);
});
