import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import type {
  HandbookData,
  LocationInfo,
  Shelter,
  MedicalFacility,
  Member,
} from "@/types";
import { FOREIGN_RESOURCES, FOREIGN_HOTLINES } from "@/lib/foreign-resources";
import { MIGRANT_PHRASES, PHRASE_CATEGORIES } from "@/lib/migrant-phrases";
import { pt, ptEn, type BiMode } from "@/lib/pdf-i18n";

// Fonts served from jsDelivr CDN (free, unlimited bandwidth)
// Pin to commit hash to bust jsDelivr cache after font re-subset
const CDN_FONTS =
  "https://cdn.jsdelivr.net/gh/siriushsu/taiwan-disaster-handbook@71b728b/public/fonts";
Font.register({
  family: "NotoSansTC",
  fonts: [
    {
      src: `${CDN_FONTS}/NotoSansTC-Regular-subset.ttf?v=2`,
      fontWeight: "normal",
    },
    { src: `${CDN_FONTS}/NotoSansTC-Bold-subset.ttf?v=2`, fontWeight: "bold" },
  ],
});

// Noto Sans Thai — separate registration because Thai glyphs are not in NotoSansTC subset.
// Loaded from Google Fonts raw file mirror.
Font.register({
  family: "NotoSansThai",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest/thai-400-normal.ttf",
      fontWeight: "normal",
    },
  ],
});

/* ── color system ───────────────────────────────────────
   PDF-wide palette. Keep in sync with DESIGN.md. Two axes:
   1. Facility category — compass tags + numbered badges
   2. Disaster scenario — EAC (Page 2) + Quick Response (Page 8)
   Map pin colors are a third axis (Leaflet defaults) — deliberately
   not reused here; leaflet legend renders its own dots on P4. */
const CAT_SHELTER = "#0D9488"; // brand primary teal
const CAT_AIR_RAID = "#8b5cf6"; // purple
const CAT_MEDICAL = "#059669"; // emerald
const CAT_AED = "#dc2626"; // red

const DIS_EQ = "#C93B3B"; // earthquake — red (semantic error)
const DIS_AIR = "#8b5cf6"; // air raid — same purple as CAT_AIR_RAID
const DIS_FIRE = "#d4882a"; // fire — amber
const DIS_TYPHOON = "#3b6fd4"; // typhoon — blue

/* ── helpers ───────────────────────────────────────── */
let _lang: BiMode = "zh";

/** Bilingual header: returns "中文 / English" in bi mode, else single language */
function bi(mode: BiMode, zhKey: string, enText: string): string {
  if (mode === "en") return enText;
  if (mode === "zh") return pt(mode, zhKey);
  return `${pt(mode, zhKey)} / ${enText}`;
}

function distText(m?: number) {
  if (!m) return "";
  if (_lang === "en") return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
  return m < 1000
    ? `${m} ${pt(_lang, "dist_meters")}`
    : `${(m / 1000).toFixed(1)} ${pt(_lang, "dist_km")}`;
}
function walkMin(m?: number) {
  if (!m) return "";
  const mins = Math.ceil(m / 80);
  if (_lang === "en") return mins <= 1 ? "~1 min walk" : `~${mins} min walk`;
  return mins <= 1
    ? pt(_lang, "walk_1min")
    : `${pt(_lang, "walk_about")} ${mins} ${pt(_lang, "walk_min")}`;
}
function memberAddr(m: Member, householdAddr: string) {
  if (m.hasDifferentAddress && m.city && m.address)
    return `${m.city}${m.district}${m.address}`;
  return householdAddr;
}

/* ── styles ────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    fontFamily: "NotoSansTC",
    padding: "22 32",
    fontSize: 9,
    color: "#2D2A26",
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: "#9C9691" },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0D9488",
    borderBottomWidth: 1,
    borderBottomColor: "#F0FDFA",
    paddingBottom: 2,
    marginBottom: 3,
    marginTop: 6,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  // cover
  coverPage: {
    fontFamily: "NotoSansTC",
    padding: 0,
    backgroundColor: "#0D9488",
  },
  coverTop: { padding: "60 40 40", flex: 1 },
  coverTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 6,
  },
  coverSub: { fontSize: 14, color: "#ffffff", opacity: 0.75, marginBottom: 20 },
  coverBox: {
    backgroundColor: "#0F766E",
    borderRadius: 8,
    padding: "14 20",
    marginBottom: 10,
  },
  coverBoxLabel: {
    fontSize: 9,
    color: "#ffffff",
    opacity: 0.6,
    marginBottom: 3,
  },
  coverBoxValue: { fontSize: 13, color: "#ffffff", fontWeight: "bold" },
  coverFooter: {
    backgroundColor: "#0F766E",
    padding: "14 40",
    fontSize: 9,
    color: "#ffffff",
    opacity: 0.6,
  },
  // action card
  actionPage: {
    fontFamily: "NotoSansTC",
    padding: "20 30",
    fontSize: 10,
    color: "#2D2A26",
    backgroundColor: "#FEF7E6",
  },
  actionBanner: {
    backgroundColor: "#C93B3B",
    padding: "10 14",
    borderRadius: 8,
    marginBottom: 12,
  },
  actionBannerText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  actionBannerSub: {
    color: "#fecaca",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    borderWidth: 2,
    borderRadius: 8,
    padding: "8 12",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  actionEmoji: { fontSize: 20, marginRight: 10, width: 30 },
  actionLabel: { fontSize: 12, fontWeight: "bold", marginBottom: 2 },
  actionBody: { fontSize: 9.5, color: "#6B6560", lineHeight: 1.4 },
  actionMeet: {
    backgroundColor: "#0D9488",
    borderRadius: 8,
    padding: "10 14",
    marginTop: 4,
    marginBottom: 8,
  },
  actionMeetLabel: {
    color: "#ffffff",
    opacity: 0.6,
    fontSize: 8,
    fontWeight: "bold",
  },
  actionMeetValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  actionMeetDist: {
    color: "#ffffff",
    opacity: 0.75,
    fontSize: 9,
    marginTop: 2,
  },
  // numbers
  numRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#FCEAEA",
  },
  numBig: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#C93B3B",
    width: 145,
    flexShrink: 0,
    paddingRight: 8,
  },
  numLabel: { flex: 1, fontSize: 10, color: "#6B6560" },
  // contact card
  contactCard: {
    backgroundColor: "#F0FDFA",
    borderRadius: 6,
    padding: "8 12",
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#0D9488",
  },
  contactName: { fontWeight: "bold", fontSize: 11 },
  contactPhone: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D9488",
    marginTop: 4,
    lineHeight: 1.2,
  },
  contactMeta: { fontSize: 8, color: "#6B6560", marginTop: 4 },
  // reunion
  reunionBox: {
    borderWidth: 1,
    borderColor: "#E8E4E0",
    borderRadius: 6,
    padding: "8 12",
    marginBottom: 6,
  },
  reunionName: { fontWeight: "bold", fontSize: 10.5, color: "#0D9488" },
  reunionRow: { flexDirection: "row", marginTop: 3 },
  reunionLabel: { width: 60, color: "#6B6560", fontSize: 8.5 },
  reunionValue: { flex: 1, fontSize: 8.5 },
  // location
  locHeader: {
    backgroundColor: "#0D9488",
    padding: "8 12",
    borderRadius: 6,
    marginBottom: 10,
  },
  locTitle: { fontSize: 13, fontWeight: "bold", color: "#ffffff" },
  locAddr: { fontSize: 8, color: "#ffffff", opacity: 0.75, marginTop: 1 },
  shelterCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5F3",
  },
  shelterNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0F766E",
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3,
    marginRight: 6,
    flexShrink: 0,
  },
  shelterInfo: { flex: 1 },
  shelterName: { fontWeight: "bold", fontSize: 9 },
  shelterAddr: { color: "#6B6560", fontSize: 7.5 },
  shelterDist: { color: "#1A8A5C", fontSize: 7.5 },
  shelterTag: { fontSize: 6.5, color: "#8b5cf6", marginTop: 1 },
  medCard: {
    flexDirection: "row",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5F3",
  },
  meetBox: { flexDirection: "row", gap: 6, marginTop: 2 },
  meetCard: { flex: 1, borderRadius: 6, padding: "5 8" },
  meetLabel: { fontSize: 7, fontWeight: "bold", marginBottom: 1 },
  meetValue: { fontSize: 8.5, fontWeight: "bold" },
  // personal card
  pCard: {
    borderWidth: 1.5,
    borderColor: "#2D2A26",
    borderRadius: 6,
    padding: "8 10",
    marginBottom: 8,
    borderStyle: "dashed",
  },
  pCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E4E0",
    paddingBottom: 4,
    marginBottom: 4,
  },
  pCardName: { fontWeight: "bold", fontSize: 12, color: "#0D9488" },
  pCardBlood: { fontWeight: "bold", fontSize: 11, color: "#C93B3B" },
  pCardRow: { flexDirection: "row", marginTop: 2 },
  pCardLabel: { width: 52, color: "#6B6560", fontSize: 8 },
  pCardValue: { flex: 1, fontSize: 8 },
  // checklist
  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  checkbox: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: "#9C9691",
    borderRadius: 2,
    marginRight: 6,
    marginTop: 1.5,
    flexShrink: 0,
  },
  checkText: { flex: 1, fontSize: 9.5 },
  checkCat: {
    fontWeight: "bold",
    fontSize: 10.5,
    color: "#2D2A26",
    marginBottom: 5,
    marginTop: 8,
  },
  // scenario
  scenarioTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 2,
  },
  step: { flexDirection: "row", marginBottom: 5 },
  stepNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
    paddingTop: 3.5,
    flexShrink: 0,
    color: "#ffffff",
  },
  stepText: { flex: 1, fontSize: 9.5 },
  warningBox: {
    borderRadius: 6,
    padding: "6 10",
    marginTop: 4,
    marginBottom: 4,
  },
  tipBox: {
    backgroundColor: "#F0FDFA",
    borderRadius: 6,
    padding: "6 10",
    marginTop: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#B8DDDE",
  },
  tipText: { fontSize: 8.5, color: "#0F766E" },
  // member health
  memberCard: {
    borderWidth: 1,
    borderColor: "#E8E4E0",
    borderRadius: 6,
    padding: "8 12",
    marginBottom: 8,
  },
  memberName: { fontWeight: "bold", fontSize: 12, color: "#0D9488" },
  infoRow: { flexDirection: "row", marginTop: 4 },
  infoLabel: { width: 70, color: "#6B6560", fontSize: 9 },
  infoValue: { flex: 1, fontSize: 9 },
  alertBadge: {
    backgroundColor: "#FCEAEA",
    borderRadius: 4,
    padding: "2 6",
    marginTop: 3,
    alignSelf: "flex-start",
  },
  alertText: { color: "#C93B3B", fontSize: 8.5 },
  noDataBox: {
    backgroundColor: "#FEF7E6",
    borderRadius: 6,
    padding: "8 12",
    marginBottom: 6,
  },
});

function Footer({ label, biMode = "zh" }: { label: string; biMode?: BiMode }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{pt(biMode, "label_footer_handbook")}</Text>
      <Text style={s.footerText}>{label}</Text>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   PAGE: Location Evacuation Guide
   ══════════════════════════════════════════════════════ */
function DirItem({
  item,
}: {
  item: { name: string; dir: string; dist: string; color: string; tag: string };
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
    >
      <View
        style={{
          width: 28,
          height: 16,
          borderRadius: 3,
          backgroundColor: item.color,
          marginRight: 5,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 6.5, color: "#fff", fontWeight: "bold" }}>
          {item.dir}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 8, fontWeight: "bold" }}>
          {item.name.length > 12 ? item.name.slice(0, 12) + "..." : item.name}
        </Text>
        <Text style={{ fontSize: 7, color: "#6B6560" }}>
          {item.tag}　{item.dist}
        </Text>
      </View>
    </View>
  );
}

function MapLegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}
    >
      <View
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: color,
          marginRight: 2,
        }}
      />
      <Text style={{ fontSize: 7, color: "#6B6560" }}>{label}</Text>
    </View>
  );
}

function DirMap({ loc, mapImg }: { loc: LocationInfo; mapImg?: string }) {
  if (!loc.geo) return null;

  // Prefer captured map image (base64 from Leaflet)
  if (mapImg) {
    return (
      <View style={{ marginBottom: 8 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
        <Image
          src={mapImg}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 4,
            objectFit: "cover",
          }}
        />
        <View
          style={{ flexDirection: "row", marginTop: 3, alignItems: "center" }}
        >
          <MapLegendDot color="#ef4444" label={pt(_lang, "legend_home")} />
          <MapLegendDot color="#3b82f6" label={pt(_lang, "legend_shelter")} />
          <MapLegendDot color="#8b5cf6" label={pt(_lang, "legend_air_raid")} />
          <MapLegendDot color="#059669" label={pt(_lang, "legend_medical")} />
          <Text style={{ fontSize: 6.5, color: "#9C9691", marginLeft: 6 }}>
            Map (c) OpenStreetMap
          </Text>
        </View>
      </View>
    );
  }
  const shelters = loc.shelters
    .filter((sh: Shelter) => sh.type !== "air_defense")
    .slice(0, 3);
  const airRaid = (loc.airRaid ?? []).slice(0, 2);
  const medical = loc.medical.slice(0, 2);
  const items: {
    name: string;
    dir: string;
    dist: string;
    color: string;
    tag: string;
  }[] = [];
  for (const sh of shelters) {
    if (sh.lat && sh.lng)
      items.push({
        name: sh.name,
        dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng),
        dist: distText(sh.distance),
        color: CAT_SHELTER,
        tag: pt(_lang, "label_shelter"),
      });
  }
  for (const sh of airRaid) {
    if (sh.lat && sh.lng)
      items.push({
        name: sh.address || sh.name,
        dir: bearing(loc.geo.lat, loc.geo.lng, sh.lat, sh.lng),
        dist: distText(sh.distance),
        color: CAT_AIR_RAID,
        tag: pt(_lang, "label_air_raid"),
      });
  }
  for (const m of medical) {
    if (m.lat && m.lng)
      items.push({
        name: m.name,
        dir: bearing(loc.geo.lat, loc.geo.lng, m.lat, m.lng),
        dist: distText(m.distance),
        color: CAT_MEDICAL,
        tag: m.hasER ? pt(_lang, "label_er") : pt(_lang, "label_medical"),
      });
  }
  if (items.length === 0) return null;
  return (
    <View
      style={{
        backgroundColor: "#F7F5F3",
        borderRadius: 6,
        padding: "8 12",
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E8E4E0",
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "bold",
          color: "#2D2A26",
          marginBottom: 5,
        }}
      >
        {pt(_lang, "loc_dir")}
      </Text>
      <View style={{ flexDirection: "row" }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          {items
            .filter((_, i) => i % 2 === 0)
            .map((item, i) => (
              <DirItem key={i} item={item} />
            ))}
        </View>
        <View style={{ flex: 1 }}>
          {items
            .filter((_, i) => i % 2 === 1)
            .map((item, i) => (
              <DirItem key={i} item={item} />
            ))}
        </View>
      </View>
    </View>
  );
}

function LocationPage({
  loc,
  mapImg,
  biMode = "zh",
}: {
  loc: LocationInfo;
  mapImg?: string;
  biMode?: BiMode;
}) {
  const natural = loc.shelters.filter(
    (sh: Shelter) => sh.type !== "air_defense",
  );
  const air = loc.airRaid ?? [];
  const mainShelter = natural[0];
  const backupShelter = natural[1];
  const isBasement = /^[Bb]|地下/.test(loc.floor ?? "");

  return (
    <>
      <Page size="A4" style={s.page}>
        <View style={s.locHeader}>
          <Text style={s.locTitle}>
            {loc.label}　{pt(biMode, "loc_evac_guide_suffix")}
            {biMode === "bi" ? " / " + ptEn("loc_evac_guide_suffix") : ""}
          </Text>
          <Text style={s.locAddr}>{loc.address}</Text>
          {loc.housingType === "apartment" && loc.floor ? (
            <Text style={s.locAddr}>
              {pt(biMode, "loc_apt_building")} {loc.floor}{" "}
              {pt(biMode, "loc_floor_suffix")}
              {biMode === "bi" ? " / Apt Bldg" : ""}
            </Text>
          ) : null}
        </View>

        <DirMap loc={loc} mapImg={mapImg} />

        {/* Meeting Points */}
        <Text style={s.sectionTitle}>{pt(biMode, "loc_meeting")}</Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
            {ptEn("loc_meeting")}
          </Text>
        )}
        <Text
          style={{
            fontSize: 7.5,
            color: "#6B6560",
            marginBottom: biMode === "bi" ? 1 : 2,
          }}
        >
          {pt(biMode, "loc_meeting_desc")}
        </Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560", marginBottom: 4 }}>
            {ptEn("loc_meeting_desc")}
          </Text>
        )}
        <View style={s.meetBox}>
          <View
            style={[
              s.meetCard,
              {
                backgroundColor: "#F0FDFA",
                borderWidth: 1,
                borderColor: "#F0FDFA",
              },
            ]}
          >
            <Text style={[s.meetLabel, { color: "#0D9488" }]}>
              {pt(biMode, "loc_primary")}
              {biMode === "bi" ? " / " + ptEn("loc_primary") : ""}
            </Text>
            <Text style={s.meetValue}>
              {mainShelter?.name ?? pt(biMode, "loc_fallback_primary")}
            </Text>
            {mainShelter?.address ? (
              <Text style={{ fontSize: 7, color: "#6B6560", marginTop: 1 }}>
                {mainShelter.address}
              </Text>
            ) : null}
            {mainShelter?.distance ? (
              <Text style={{ fontSize: 8, color: "#059669", marginTop: 1 }}>
                {distText(mainShelter.distance)}（
                {walkMin(mainShelter.distance)}）
              </Text>
            ) : null}
          </View>
          <View
            style={[
              s.meetCard,
              {
                backgroundColor: "#fff7ed",
                borderWidth: 1,
                borderColor: "#fed7aa",
              },
            ]}
          >
            <Text style={[s.meetLabel, { color: "#c2410c" }]}>
              {pt(biMode, "loc_backup")}
              {biMode === "bi" ? " / " + ptEn("loc_backup") : ""}
            </Text>
            <Text style={s.meetValue}>
              {backupShelter?.name ?? pt(biMode, "loc_fallback_backup")}
            </Text>
            {backupShelter?.address ? (
              <Text style={{ fontSize: 7, color: "#6B6560", marginTop: 1 }}>
                {backupShelter.address}
              </Text>
            ) : null}
            {backupShelter?.distance ? (
              <Text style={{ fontSize: 8, color: "#059669", marginTop: 1 }}>
                {distText(backupShelter.distance)}（
                {walkMin(backupShelter.distance)}）
              </Text>
            ) : null}
          </View>
        </View>

        {/* Nearest shelters */}
        <Text style={s.sectionTitle}>{pt(biMode, "loc_shelters")}</Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
            {ptEn("loc_shelters")}
          </Text>
        )}
        <Text style={{ fontSize: 6, color: "#9C9691", marginBottom: 2 }}>
          {pt(biMode, "loc_qr_hint")}
        </Text>
        {natural.length > 0 ? (
          natural.slice(0, 5).map((sh: Shelter, i: number) => (
            <View key={i} style={s.shelterCard}>
              <Text style={s.shelterNum}>{i + 1}</Text>
              <View style={s.shelterInfo}>
                <Text style={s.shelterName}>{sh.name}</Text>
                {sh.address ? (
                  <Text style={s.shelterAddr}>{sh.address}</Text>
                ) : null}
                <Text style={s.shelterDist}>
                  {distText(sh.distance)}（{walkMin(sh.distance)}）
                  {sh.capacity
                    ? `　${pt(biMode, "loc_capacity_prefix")} ${sh.capacity.toLocaleString()} ${pt(biMode, "loc_capacity_suffix")}`
                    : ""}
                  {sh.indoor ? `　${pt(biMode, "label_indoor")}` : ""}
                </Text>
                {sh.disasterTypes ? (
                  <Text style={s.shelterAddr}>
                    {pt(biMode, "label_applicable")}：{sh.disasterTypes}
                  </Text>
                ) : null}
                {sh.phone ? (
                  <Text style={s.shelterAddr}>
                    {pt(biMode, "label_mgmt_phone")}：{sh.phone}
                  </Text>
                ) : null}
                {sh.vulnerableFriendly ? (
                  <Text
                    style={{ fontSize: 7.5, color: "#059669", marginTop: 1 }}
                  >
                    {pt(biMode, "label_vulnerable")}
                  </Text>
                ) : null}
              </View>
              {sh.lat && sh.lng ? (
                /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */
                <View style={{ alignItems: "center", flexShrink: 0 }}>
                  {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
                  <Image
                    src={qrUrl(mapsUrl(sh.lat, sh.lng), 80)}
                    style={{ width: 28, height: 28 }}
                  />
                  <Text
                    style={{ fontSize: 5.5, color: "#6B6560", marginTop: 1 }}
                  >
                    {pt(biMode, "qr_nav")}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        ) : (
          <View style={s.noDataBox}>
            <Text style={{ fontSize: 9, color: "#854d0e" }}>
              {pt(biMode, "loc_no_data")}
            </Text>
          </View>
        )}
        <Text style={s.shelterTag}>{pt(biMode, "loc_shelters_src")}</Text>

        {/* Backup plan callout — reminds users the handbook snapshot may be
            stale (shelters close, construction, etc.) and points them back
            to the live map. Fills the empty bottom third of the page. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            padding: "10 12",
            borderRadius: 8,
            backgroundColor: "#FEF7E6",
            borderWidth: 1,
            borderColor: "#FDE68A",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: "#854d0e",
                marginBottom: 2,
              }}
            >
              {pt(biMode, "loc_backup_title")}
            </Text>
            <Text style={{ fontSize: 8.5, color: "#6B6560" }}>
              {pt(biMode, "loc_backup_body")}
            </Text>
          </View>
          <View style={{ alignItems: "center", flexShrink: 0 }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image
              src={qrUrl(
                `https://disaster-handbook.vercel.app/?city=${encodeURIComponent(loc.city)}&district=${encodeURIComponent(loc.district)}`,
                80,
              )}
              style={{ width: 44, height: 44 }}
            />
            <Text style={{ fontSize: 5.5, color: "#6B6560", marginTop: 1 }}>
              {pt(biMode, "qr_nav")}
            </Text>
          </View>
        </View>

        <Footer
          label={`${loc.label} - ${pt(biMode, "loc_shelters")}`}
          biMode={biMode}
        />
      </Page>

      {/* Page 2: Air Raid + Medical + AED + Housing-specific tips */}
      <Page size="A4" style={s.page}>
        <View style={[s.locHeader, { marginBottom: 8 }]}>
          <Text style={[s.locTitle, { fontSize: 11 }]}>
            {loc.label}　{pt(biMode, "loc_evac_guide_suffix")}（
            {biMode === "en" ? "cont." : "續"}）
          </Text>
        </View>

        {/* Air defense shelters */}
        {air.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{pt(biMode, "loc_airraid")}</Text>
            {biMode === "bi" && (
              <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                {ptEn("loc_airraid")}
              </Text>
            )}
            {air.slice(0, 3).map((sh: Shelter, i: number) => (
              <View key={i} style={s.shelterCard}>
                <Text style={[s.shelterNum, { backgroundColor: CAT_AIR_RAID }]}>
                  {i + 1}
                </Text>
                <View style={s.shelterInfo}>
                  <Text style={s.shelterName}>{sh.name}</Text>
                  {sh.address ? (
                    <Text style={s.shelterAddr}>{sh.address}</Text>
                  ) : null}
                  <Text style={s.shelterDist}>
                    {distText(sh.distance)}（{walkMin(sh.distance)}）
                  </Text>
                </View>
                {sh.lat && sh.lng ? (
                  <View style={{ alignItems: "center", flexShrink: 0 }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
                    <Image
                      src={qrUrl(mapsUrl(sh.lat, sh.lng), 80)}
                      style={{ width: 28, height: 28 }}
                    />
                    <Text
                      style={{ fontSize: 5.5, color: "#6B6560", marginTop: 1 }}
                    >
                      {pt(biMode, "qr_nav")}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* Medical */}
        {loc.medical.length > 0 && (
          <>
            <Text style={s.sectionTitle}>{pt(biMode, "loc_medical")}</Text>
            {biMode === "bi" && (
              <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                {ptEn("loc_medical")}
              </Text>
            )}
            {loc.medical.slice(0, 3).map((m: MedicalFacility, i: number) => (
              <View key={i} style={s.medCard}>
                <Text style={[s.shelterNum, { backgroundColor: CAT_MEDICAL }]}>
                  {i + 1}
                </Text>
                <View style={s.shelterInfo}>
                  <Text style={s.shelterName}>{m.name}</Text>
                  {m.address ? (
                    <Text style={s.shelterAddr}>{m.address}</Text>
                  ) : null}
                  <Text style={s.shelterDist}>
                    {m.type === "hospital"
                      ? pt(biMode, "label_hospital")
                      : pt(biMode, "label_clinic")}
                    {m.erLevel === "重度"
                      ? "（重度急救責任醫院）"
                      : m.hasER
                        ? pt(biMode, "label_has_er_paren")
                        : ""}
                    　{distText(m.distance)}（{walkMin(m.distance)}）
                    {m.phone ? `　${m.phone}` : ""}
                  </Text>
                </View>
                {m.lat && m.lng ? (
                  <View style={{ alignItems: "center", flexShrink: 0 }}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
                    <Image
                      src={qrUrl(mapsUrl(m.lat, m.lng), 80)}
                      style={{ width: 28, height: 28 }}
                    />
                    <Text
                      style={{ fontSize: 5.5, color: "#6B6560", marginTop: 1 }}
                    >
                      {pt(biMode, "qr_nav")}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </>
        )}

        {/* AED */}
        {(loc.aed ?? []).length > 0 && (
          <>
            <Text style={s.sectionTitle}>
              {biMode === "en"
                ? "Nearest AED"
                : "最近 AED（自動體外心臟電擊器）"}
            </Text>
            {biMode === "bi" && (
              <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                Nearest AED (Automated External Defibrillator)
              </Text>
            )}
            {(loc.aed ?? []).slice(0, 2).map(
              (
                a: {
                  name: string;
                  address: string;
                  lat: number;
                  lng: number;
                  location: string;
                  phone: string;
                  distance?: number;
                },
                i: number,
              ) => (
                <View key={i} style={s.medCard}>
                  <Text style={[s.shelterNum, { backgroundColor: CAT_AED }]}>
                    {i + 1}
                  </Text>
                  <View style={s.shelterInfo}>
                    <Text style={s.shelterName}>{a.name}</Text>
                    {a.location ? (
                      <Text style={s.shelterAddr}>{a.location}</Text>
                    ) : null}
                    <Text style={s.shelterDist}>
                      {distText(a.distance)}（{walkMin(a.distance)}）
                      {a.phone ? `　${a.phone}` : ""}
                    </Text>
                  </View>
                </View>
              ),
            )}
          </>
        )}

        {/* Apartment-specific evacuation */}
        {loc.housingType === "apartment" && (
          <>
            <Text style={s.sectionTitle}>{pt(biMode, "loc_apt_title")}</Text>
            {biMode === "bi" && (
              <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                {ptEn("loc_apt_title")}
              </Text>
            )}
            <View
              style={[
                s.warningBox,
                {
                  backgroundColor: "#fef2f2",
                  borderWidth: 1,
                  borderColor: "#fecaca",
                },
              ]}
            >
              {[
                [
                  isBasement
                    ? `${pt(biMode, "apt_basement_prefix")} ${loc.floor} ${pt(biMode, "loc_floor_suffix")}。${pt(biMode, "apt_basement_eq")}`
                    : `${pt(biMode, "apt_1_pre")} ${loc.floor || "?"} ${pt(biMode, "apt_1_post")}`,
                  isBasement
                    ? `${ptEn("apt_basement_prefix")} ${loc.floor} ${ptEn("loc_floor_suffix")}. ${ptEn("apt_basement_eq")}`
                    : `${ptEn("apt_1_pre")} ${loc.floor || "?"} ${ptEn("apt_1_post")}`,
                ],
                [
                  isBasement
                    ? pt(biMode, "apt_basement_flood")
                    : pt(biMode, "apt_2"),
                  isBasement ? ptEn("apt_basement_flood") : ptEn("apt_2"),
                ],
                [pt(biMode, "apt_3"), ptEn("apt_3")],
                [pt(biMode, "apt_4"), ptEn("apt_4")],
                [
                  `${pt(biMode, "apt_go_to_meeting")}${mainShelter?.name ?? pt(biMode, "loc_fallback_plaza")}`,
                  `${ptEn("apt_go_to_meeting")}${mainShelter?.name ?? ptEn("loc_fallback_plaza")}`,
                ],
              ].map(([zh, en], i) => (
                <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text
                    style={{ color: "#C93B3B", marginRight: 5, fontSize: 9 }}
                  >
                    {"·"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9 }}>{zh}</Text>
                    {biMode === "bi" && (
                      <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                        {en}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {loc.housingType === "house" && (
          <>
            <Text style={s.sectionTitle}>{pt(biMode, "loc_house_title")}</Text>
            {biMode === "bi" && (
              <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                {ptEn("loc_house_title")}
              </Text>
            )}
            <View
              style={[
                s.warningBox,
                {
                  backgroundColor: "#fef2f2",
                  borderWidth: 1,
                  borderColor: "#fecaca",
                },
              ]}
            >
              {[
                [pt(biMode, "house_1"), ptEn("house_1")],
                [pt(biMode, "house_2"), ptEn("house_2")],
                [pt(biMode, "house_3"), ptEn("house_3")],
                [
                  `${pt(biMode, "house_4_prefix")}${mainShelter?.name ?? pt(biMode, "loc_fallback_plaza")}`,
                  `${ptEn("house_4_prefix")}${mainShelter?.name ?? ptEn("loc_fallback_plaza")}`,
                ],
              ].map(([zh, en], i) => (
                <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                  <Text
                    style={{ color: "#C93B3B", marginRight: 5, fontSize: 9 }}
                  >
                    {"·"}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9 }}>{zh}</Text>
                    {biMode === "bi" && (
                      <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                        {en}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Hand-drawn escape route area — uses the empty bottom third of P5
            to give the user space to sketch their actual route. Intentionally
            blank: a pre-drawn map from us would be wrong at the last turn. */}
        <View style={{ marginTop: 10 }}>
          <Text style={s.sectionTitle}>
            {biMode === "en"
              ? "Hand-drawn evacuation route"
              : biMode === "zh"
                ? "手繪逃生路線"
                : "手繪逃生路線 / Hand-drawn evacuation route"}
          </Text>
          <Text
            style={{
              fontSize: 8,
              color: "#6B6560",
              marginBottom: 4,
            }}
          >
            {biMode === "en"
              ? `Sketch the route from your door to ${mainShelter?.name ?? "the meeting point"}. Mark visible landmarks (shops, lights, junctions) so anyone in the family can follow it.`
              : `在下方畫出你家到「${mainShelter?.name ?? pt(biMode, "loc_fallback_plaza")}」的路線，標上明顯地標（便利商店、紅綠燈、巷口），家裡每個人都能照著走。`}
          </Text>
          <View
            style={{
              height: 220,
              borderWidth: 1,
              borderColor: "#D4CFC9",
              borderStyle: "dashed",
              borderRadius: 4,
              backgroundColor: "#F7F5F3",
            }}
          />
        </View>

        <Footer
          label={`${loc.label} ${pt(biMode, "loc_evac_guide_footer")}`}
          biMode={biMode}
        />
      </Page>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
function qrUrl(text: string, size = 100) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/* Bearing from home to a point, returns compass direction */
function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): string {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLng);
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  if (deg < 22.5 || deg >= 337.5) return pt(_lang, "compass_n");
  if (deg < 67.5) return pt(_lang, "compass_ne");
  if (deg < 112.5) return pt(_lang, "compass_e");
  if (deg < 157.5) return pt(_lang, "compass_se");
  if (deg < 202.5) return pt(_lang, "compass_s");
  if (deg < 247.5) return pt(_lang, "compass_sw");
  if (deg < 292.5) return pt(_lang, "compass_w");
  return pt(_lang, "compass_nw");
}

export default function HandbookPDF({
  data,
  mapImages,
  biMode = "zh",
}: {
  data: HandbookData;
  mapImages?: Record<number, string>;
  biMode?: BiMode;
}) {
  // eslint-disable-next-line react-hooks/globals -- @react-pdf/renderer renders synchronously; this is not a DOM re-render side effect
  _lang = biMode;
  const { household } = data;
  const allMembers = household.members.filter((m) => m.name);
  const allContacts = household.contacts.filter((c) => c.name && c.phone);
  const outOfCityContact = allContacts.find((c) => c.isOutOfCity);
  const mainLocation = data.locations[0];
  const mainShelter = mainLocation?.shelters[0];
  const mainHospital =
    mainLocation?.medical?.find(
      (m: MedicalFacility) => m.type === "hospital",
    ) ?? mainLocation?.medical?.[0];
  const fullAddr = `${household.city}${household.district}${household.address}`;

  return (
    <Document
      title={`${pt(biMode, "cover_title")} - ${allMembers[0]?.name ?? "—"}`}
      language={biMode === "en" ? "en" : "zh-TW"}
    >
      {/* ─── PAGE 1: COVER ─── */}
      <Page size="A4" style={s.coverPage}>
        <View style={s.coverTop}>
          <Text style={s.coverTitle}>{pt(biMode, "cover_title")}</Text>
          {biMode === "bi" && (
            <Text
              style={[
                s.coverSub,
                { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
              ]}
            >
              Family Emergency Handbook
            </Text>
          )}
          <Text style={s.coverSub}>{pt(biMode, "cover_sub")}</Text>
          {biMode === "bi" && (
            <Text style={[s.coverSub, { fontSize: 10 }]}>
              {ptEn("cover_sub")}
            </Text>
          )}
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>
              {pt(biMode, "cover_addr")}
              {biMode === "bi" ? " / Home Address" : ""}
            </Text>
            <Text style={s.coverBoxValue}>{fullAddr}</Text>
          </View>
          <View style={s.coverBox}>
            <Text style={s.coverBoxLabel}>
              {pt(biMode, "cover_members")}
              {biMode === "bi" ? " / Family Members" : ""}
            </Text>
            <Text style={s.coverBoxValue}>
              {allMembers.map((m) => m.name).join("、") || "—"}
            </Text>
          </View>
          {mainShelter && (
            <View style={s.coverBox}>
              <Text style={s.coverBoxLabel}>
                {pt(biMode, "cover_meeting")}
                {biMode === "bi" ? " / Meeting Point" : ""}
              </Text>
              <Text style={s.coverBoxValue}>{mainShelter.name}</Text>
              <Text style={{ color: "#ffffff", fontSize: 9, marginTop: 2 }}>
                {distText(mainShelter.distance)}（
                {walkMin(mainShelter.distance)}）
              </Text>
            </View>
          )}
          {outOfCityContact && (
            <View style={s.coverBox}>
              <Text style={s.coverBoxLabel}>
                {pt(biMode, "cover_contact")}
                {biMode === "bi" ? " / " + ptEn("cover_contact") : ""}
              </Text>
              <Text style={s.coverBoxValue}>{outOfCityContact.name}</Text>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                {outOfCityContact.phone}
              </Text>
            </View>
          )}
          <View style={[s.coverBox, { marginTop: 12 }]}>
            <Text style={s.coverBoxLabel}>
              {pt(biMode, "cover_date")}
              {biMode === "bi" ? " / Created" : ""}
            </Text>
            <Text style={{ color: "#ffffff", fontSize: 11 }}>
              {data.generatedAt}　{pt(biMode, "cover_update")}
              {biMode === "bi" ? " / " + ptEn("cover_update") : ""}
            </Text>
          </View>
        </View>
        <View style={s.coverFooter}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text>{pt(biMode, "cover_footer")}</Text>
              {biMode === "bi" && (
                <Text style={{ fontSize: 8, color: "#ffffff", marginTop: 1 }}>
                  {ptEn("cover_footer")}
                </Text>
              )}
              <Text style={{ marginTop: 3 }}>{pt(biMode, "cover_qr")}</Text>
              {biMode === "bi" && (
                <Text style={{ fontSize: 8, color: "#ffffff", marginTop: 1 }}>
                  {ptEn("cover_qr")}
                </Text>
              )}
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
            <Image
              src={qrUrl(
                `https://disaster-handbook.vercel.app/?city=${encodeURIComponent(household.city)}&district=${encodeURIComponent(household.district)}`,
              )}
              style={{ width: 56, height: 56 }}
            />
          </View>
        </View>
      </Page>

      {/* ─── USAGE GUIDE PAGE (conditional on isForeignNational) ─── */}
      {household.isForeignNational && (
        <Page size="A4" style={s.page}>
          <Text
            style={[
              s.scenarioTitle,
              { borderBottomColor: "#0ea5e9", color: "#0369a1" },
            ]}
          >
            使用說明 / How to Use This Handbook
          </Text>
          <Text style={{ fontSize: 7, color: "#64748b", marginBottom: 2 }}>
            Hướng dẫn sử dụng · Cara penggunaan · วิธีใช้ · Paano gamitin
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: "#374151",
              marginBottom: 10,
              lineHeight: 1.4,
            }}
          >
            遇到緊急狀況時，翻到對應頁面。有些頁面是給你自己看的，有些是給幫助你的台灣人看的。
            {"\n"}
            In an emergency, open the relevant page. Some pages are for you to
            read; others are for Taiwanese people helping you.
          </Text>

          {/* Two-column: for self / for helpers */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "#eff6ff",
                borderRadius: 6,
                padding: 8,
                borderWidth: 1,
                borderColor: "#bfdbfe",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#1e40af",
                  marginBottom: 3,
                }}
              >
                📱 給你自己看
              </Text>
              <Text
                style={{ fontSize: 7.5, color: "#1e40af", marginBottom: 4 }}
              >
                For yourself
              </Text>
              <Text style={{ fontSize: 8, color: "#1e3a8a", lineHeight: 1.35 }}>
                · 緊急行動卡 Action Card{"\n"}· 家庭團聚計畫 Reunion Plan{"\n"}·
                外籍人士頁 Foreign Nationals Info{"\n"}· 緊急聯絡卡 Emergency
                Card{"\n"}· 物資清單 Supply Checklist
              </Text>
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: "#f0fdf4",
                borderRadius: 6,
                padding: 8,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "bold",
                  color: "#15803d",
                  marginBottom: 3,
                }}
              >
                🫱 給台灣人看
              </Text>
              <Text
                style={{ fontSize: 7.5, color: "#15803d", marginBottom: 4 }}
              >
                For Taiwanese helpers
              </Text>
              <Text style={{ fontSize: 8, color: "#14532d", lineHeight: 1.35 }}>
                · 避難所地圖 Shelter Map{"\n"}
                &nbsp;&nbsp;（地址是中文，給司機/路人看）{"\n"}· 緊急用語卡
                Phrase Card{"\n"}
                &nbsp;&nbsp;（指給對方看，不用開口）{"\n"}· 住宅避難建議
                Evacuation Tips
              </Text>
            </View>
          </View>

          {/* Scenario guide */}
          <Text style={s.sectionTitle}>
            四種情況，翻到哪一頁 / 4 Scenarios &amp; Which Page
          </Text>
          <View style={{ gap: 4, marginBottom: 10 }}>
            {[
              {
                icon: "🚨",
                zh: "地震／火災／颱風當下",
                en: "During earthquake / fire / typhoon",
                page: "緊急行動卡 Action Card",
              },
              {
                icon: "🚕",
                zh: "需要有人帶你去避難所或醫院",
                en: "Someone needs to take you to a shelter or hospital",
                page: "避難所地圖（給司機看中文地址）Shelter Map (show Chinese address)",
              },
              {
                icon: "🏥",
                zh: "在醫院或派出所，無法用中文溝通",
                en: "At hospital or police station, cannot speak Chinese",
                page: "緊急用語卡（指給對方看）Phrase Card (point to what you need)",
              },
              {
                icon: "📞",
                zh: "需要打電話求助",
                en: "Need to call for help",
                page: "外籍人士頁 Foreign Nationals Info（1955 / 113 / 辦事處 Office）",
              },
            ].map((item, i) => (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  backgroundColor: "#fafafa",
                  borderRadius: 4,
                  padding: 6,
                  borderLeftWidth: 3,
                  borderLeftColor: "#0ea5e9",
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 6 }}>
                  {item.icon}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      color: "#1e293b",
                    }}
                  >
                    {item.zh}
                  </Text>
                  <Text
                    style={{ fontSize: 7.5, color: "#64748b", marginTop: 1 }}
                  >
                    {item.en}
                  </Text>
                  <Text
                    style={{
                      fontSize: 8,
                      color: "#0369a1",
                      marginTop: 2,
                      fontWeight: "bold",
                    }}
                  >
                    → {item.page}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Important tips */}
          <Text style={s.sectionTitle}>重要提醒 / Important Reminders</Text>
          <View
            style={{
              backgroundColor: "#fef3c7",
              borderRadius: 6,
              padding: 8,
              borderWidth: 1,
              borderColor: "#fcd34d",
            }}
          >
            {[
              {
                zh: "找不到路？翻到「避難所地圖」頁，指給路人看，他們會幫你導航。",
                en: "Lost? Open the Shelter Map page, show it to any local — they will help you.",
              },
              {
                zh: "1955 可以用越南語 / 印尼語 / 泰語 / 英語通話，24 小時免費。",
                en: "1955 supports Vietnamese / Indonesian / Thai / English, 24/7 free.",
              },
              {
                zh: "避難所對所有人開放 — 不查身分證、不管國籍。",
                en: "Shelters are open to everyone — no ID check, no nationality required.",
              },
              {
                zh: "保持冷靜。翻頁指給對方看就好，不用開口說中文。",
                en: "Stay calm. Just point to a page — you don't need to speak Chinese.",
              },
            ].map((tip, i) => (
              <View key={i} style={{ marginBottom: 3 }}>
                <Text
                  style={{
                    fontSize: 8.5,
                    color: "#78350f",
                    fontWeight: "bold",
                  }}
                >
                  · {tip.zh}
                </Text>
                <Text
                  style={{ fontSize: 7.5, color: "#92400e", marginLeft: 6 }}
                >
                  {tip.en}
                </Text>
              </View>
            ))}
          </View>

          <Footer label="Usage Guide / 使用說明" biMode={biMode} />
        </Page>
      )}

      {/* ─── PAGE 2: EMERGENCY ACTION CARD ─── */}
      <Page size="A4" style={s.actionPage}>
        <View style={s.actionBanner}>
          <Text style={s.actionBannerText}>{pt(biMode, "action_title")}</Text>
          {biMode === "bi" && (
            <Text style={[s.actionBannerText, { fontSize: 9, marginTop: 2 }]}>
              {ptEn("action_title")}
            </Text>
          )}
          <Text style={s.actionBannerSub}>{pt(biMode, "action_sub")}</Text>
          {biMode === "bi" && (
            <Text style={[s.actionBannerSub, { fontSize: 7.5 }]}>
              {ptEn("action_sub")}
            </Text>
          )}
        </View>

        {/* Earthquake */}
        <View style={[s.actionRow, { borderColor: "#e04545" }]}>
          <Text style={s.actionEmoji}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: "#C93B3B" }]}>
              {pt(biMode, "eq_title")}
              {biMode === "bi" ? " / " + ptEn("eq_title") : ""}
            </Text>
            <Text style={s.actionBody}>{pt(biMode, "eq_action")}</Text>
            {biMode === "bi" && (
              <Text style={[s.actionBody, { color: "#6B6560", fontSize: 8.5 }]}>
                {ptEn("eq_action")}
              </Text>
            )}
          </View>
        </View>

        {/* Air Raid */}
        <View style={[s.actionRow, { borderColor: "#8b5cf6" }]}>
          <Text style={s.actionEmoji}>2</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: "#8b5cf6" }]}>
              {pt(biMode, "air_title")}
              {biMode === "bi" ? " / " + ptEn("air_title") : ""}
            </Text>
            <Text style={s.actionBody}>{pt(biMode, "air_action")}</Text>
            {biMode === "bi" && (
              <Text style={[s.actionBody, { color: "#6B6560", fontSize: 8.5 }]}>
                {ptEn("air_action")}
              </Text>
            )}
          </View>
        </View>

        {/* Fire */}
        <View style={[s.actionRow, { borderColor: "#d4882a" }]}>
          <Text style={s.actionEmoji}>3</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: "#d4882a" }]}>
              {pt(biMode, "fire_title")}
              {biMode === "bi" ? " / " + ptEn("fire_title") : ""}
            </Text>
            <Text style={s.actionBody}>
              {household.housingType === "apartment"
                ? /^[Bb]|地下/.test(household.floor)
                  ? pt(biMode, "fire_apt_basement")
                  : `${pt(biMode, "fire_apt_floor_pre")}${household.floor ? ` ${household.floor} ${pt(biMode, "loc_floor_suffix")}` : pt(biMode, "loc_floor_suffix")} ${pt(biMode, "fire_apt_floor_post")}`
                : pt(biMode, "fire_action_house")}
            </Text>
            {biMode === "bi" && (
              <Text style={[s.actionBody, { color: "#6B6560", fontSize: 8.5 }]}>
                {household.housingType === "apartment"
                  ? /^[Bb]|地下/.test(household.floor)
                    ? ptEn("fire_apt_basement")
                    : `${ptEn("fire_apt_floor_pre")}${household.floor ? ` ${household.floor} ${ptEn("loc_floor_suffix")}` : ptEn("loc_floor_suffix")} ${ptEn("fire_apt_floor_post")}`
                  : ptEn("fire_action_house")}
              </Text>
            )}
          </View>
        </View>

        {/* Typhoon */}
        <View style={[s.actionRow, { borderColor: "#3b6fd4" }]}>
          <Text style={s.actionEmoji}>4</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.actionLabel, { color: "#3b6fd4" }]}>
              {pt(biMode, "typhoon_title")}
              {biMode === "bi" ? " / " + ptEn("typhoon_title") : ""}
            </Text>
            <Text style={s.actionBody}>{pt(biMode, "typhoon_action")}</Text>
            {biMode === "bi" && (
              <Text style={[s.actionBody, { color: "#6B6560", fontSize: 8.5 }]}>
                {ptEn("typhoon_action")}
              </Text>
            )}
          </View>
        </View>

        {/* Infant Warning */}
        {household.hasInfant && (
          <View
            style={[
              s.warningBox,
              {
                backgroundColor: "#fef3c7",
                borderWidth: 1,
                borderColor: "#fcd34d",
                marginBottom: 6,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: "#92400e",
                marginBottom: 3,
              }}
            >
              {pt(biMode, "infant_title")}
              {biMode === "bi" ? " / " + ptEn("infant_title") : ""}
            </Text>
            {(
              [
                "infant_1",
                "infant_2",
                "infant_3",
                "infant_4",
                "infant_5",
              ] as const
            ).map((key, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 2 }}>
                <Text style={{ color: "#92400e", marginRight: 5, fontSize: 9 }}>
                  {"·"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: "#78350f" }}>
                    {pt(biMode, key)}
                  </Text>
                  {biMode === "bi" && (
                    <Text style={{ fontSize: 7.5, color: "#92400e" }}>
                      {ptEn(key)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MAIN MEETING POINT */}
        <View style={s.actionMeet}>
          <Text style={s.actionMeetLabel}>
            {pt(biMode, "meeting_label")}
            {biMode === "bi" ? " / " + ptEn("meeting_label") : ""}
          </Text>
          <Text style={s.actionMeetValue}>
            {mainShelter?.name ?? pt(biMode, "meeting_fallback")}
          </Text>
          {mainShelter?.distance && (
            <Text style={s.actionMeetDist}>
              {biMode !== "en"
                ? pt(biMode, "label_distance_from_home") + " "
                : ""}
              {distText(mainShelter.distance)}（{walkMin(mainShelter.distance)}
              ）
            </Text>
          )}
          {mainShelter?.address && (
            <Text style={s.actionMeetDist}>{mainShelter.address}</Text>
          )}
        </View>

        {/* Key numbers */}
        <View style={s.twoCol}>
          <View style={s.col}>
            {(["num_fire", "num_police", "num_air"] as const).map((key, ni) => {
              const nums = ["119", "110", "166"];
              const n = nums[ni];
              return (
                <View key={n} style={s.numRow}>
                  <Text style={s.numBig}>{n}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.numLabel}>{pt(biMode, key)}</Text>
                    {biMode === "bi" && (
                      <Text style={{ fontSize: 8, color: "#6B6560" }}>
                        {ptEn(key)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={s.col}>
            {(household.isForeignNational
              ? (["num_labor", "num_protect", "num_disaster"] as const)
              : (["num_msg", "num_mental", "num_disaster"] as const)
            ).map((key, ni) => {
              const nums = household.isForeignNational
                ? ["1955", "113", "0800-024-985"]
                : ["1991", "1925", "0800-024-985"];
              const n = nums[ni];
              return (
                <View key={n} style={s.numRow}>
                  <Text
                    style={[s.numBig, { fontSize: n.length > 4 ? 14 : 20 }]}
                  >
                    {n}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.numLabel}>{pt(biMode, key)}</Text>
                    {biMode === "bi" && (
                      <Text style={{ fontSize: 8, color: "#6B6560" }}>
                        {ptEn(key)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Universal rules — promoted from the dropped Quick Response card so the
            EAC fridge page carries the three rules that apply across all disasters. */}
        <View
          style={{
            backgroundColor: "#F0FDFA",
            borderRadius: 6,
            padding: "8 12",
            marginTop: 6,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#0D9488",
              marginBottom: 4,
            }}
          >
            {pt(biMode, "qrc_universal")}
          </Text>
          <View style={{ flexDirection: "row" }}>
            {[
              pt(biMode, "qrc_uni_1"),
              pt(biMode, "qrc_uni_2"),
              pt(biMode, "qrc_uni_3"),
            ].map((t, i) => (
              <View
                key={i}
                style={{ flex: 1, flexDirection: "row", marginRight: 6 }}
              >
                <Text
                  style={{ fontSize: 8.5, color: "#0D9488", marginRight: 3 }}
                >
                  {"•"}
                </Text>
                <Text style={{ flex: 1, fontSize: 8.5 }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer label={pt(biMode, "action_footer")} biMode={biMode} />
      </Page>

      {/* ─── PAGE 3: FAMILY REUNION & COMMUNICATION PLAN (skip if no named members) ─── */}
      {allMembers.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text
            style={[
              s.scenarioTitle,
              { borderBottomColor: "#3b82f6", color: "#0D9488" },
            ]}
          >
            {pt(biMode, "reunion_title")}
          </Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 8, color: "#0D9488", marginBottom: 2 }}>
              {ptEn("reunion_title")}
            </Text>
          )}
          <Text
            style={{
              fontSize: 9,
              color: "#6B6560",
              marginBottom: biMode === "bi" ? 2 : 8,
            }}
          >
            {pt(biMode, "reunion_desc")}
          </Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 8, color: "#6B6560", marginBottom: 6 }}>
              {ptEn("reunion_desc")}
            </Text>
          )}

          {/* Each member's location and nearest shelter */}
          <Text style={s.sectionTitle}>{pt(biMode, "reunion_members")}</Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
              {ptEn("reunion_members")}
            </Text>
          )}
          {/* Shared address + shelter block when every member lives at the
              same address (the common case). Avoids repeating four identical
              rows of "台北市信義路五段7號 / 信義國小". */}
          {(() => {
            const anyDiff = allMembers.some((m) => m.hasDifferentAddress);
            const sharedShelter = mainLocation?.shelters[0];
            if (anyDiff) return null;
            return (
              <View style={s.reunionBox}>
                <View style={s.reunionRow}>
                  <Text style={s.reunionLabel}>
                    {pt(biMode, "reunion_addr")}
                    {biMode === "bi" ? "/" + ptEn("reunion_addr") : ""}
                  </Text>
                  <Text style={s.reunionValue}>{fullAddr}</Text>
                </View>
                {sharedShelter ? (
                  <View style={s.reunionRow}>
                    <Text style={s.reunionLabel}>
                      {pt(biMode, "reunion_shelter")}
                      {biMode === "bi" ? "/" + ptEn("reunion_shelter") : ""}
                    </Text>
                    <Text style={[s.reunionValue, { fontWeight: "bold" }]}>
                      {sharedShelter.name}
                      {sharedShelter.distance
                        ? ` （${distText(sharedShelter.distance)}）`
                        : ""}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })()}

          {allMembers.map((m, i) => {
            const addr = memberAddr(m, fullAddr);
            const loc = m.hasDifferentAddress
              ? data.locations.find((l) => l.memberName === m.name)
              : mainLocation;
            const nearestShelter = loc?.shelters[0];
            const anyDiff = allMembers.some((mm) => mm.hasDifferentAddress);
            return (
              <View key={i} style={s.reunionBox}>
                <Text style={s.reunionName}>{m.name}</Text>
                {anyDiff && (
                  <>
                    <View style={s.reunionRow}>
                      <Text style={s.reunionLabel}>
                        {pt(biMode, "reunion_addr")}
                        {biMode === "bi" ? "/" + ptEn("reunion_addr") : ""}
                      </Text>
                      <Text style={s.reunionValue}>{addr}</Text>
                    </View>
                    <View style={s.reunionRow}>
                      <Text style={s.reunionLabel}>
                        {pt(biMode, "reunion_shelter")}
                        {biMode === "bi" ? "/" + ptEn("reunion_shelter") : ""}
                      </Text>
                      <Text style={[s.reunionValue, { fontWeight: "bold" }]}>
                        {nearestShelter?.name ??
                          pt(biMode, "reunion_query_office")}
                        {nearestShelter?.distance
                          ? ` （${distText(nearestShelter.distance)}）`
                          : ""}
                      </Text>
                    </View>
                  </>
                )}
                {m.isMobilityImpaired && (
                  <View style={s.reunionRow}>
                    <Text style={s.reunionLabel}>
                      {pt(biMode, "reunion_special_needs")}
                      {biMode === "bi"
                        ? "/" + ptEn("reunion_special_needs")
                        : ""}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          s.reunionValue,
                          { color: "#C93B3B", fontWeight: "bold" },
                        ]}
                      >
                        {pt(biMode, "reunion_mobility")}
                      </Text>
                      {biMode === "bi" && (
                        <Text style={{ fontSize: 7.5, color: "#C93B3B" }}>
                          {ptEn("reunion_mobility")}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                {m.medications && (
                  <View style={s.reunionRow}>
                    <Text style={s.reunionLabel}>
                      {pt(biMode, "reunion_meds")}
                      {biMode === "bi" ? "/" + ptEn("reunion_meds") : ""}
                    </Text>
                    <Text style={s.reunionValue}>{m.medications}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Communication Plan */}
          <Text style={s.sectionTitle}>{pt(biMode, "comm_title")}</Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
              {ptEn("comm_title")}
            </Text>
          )}
          <View style={[s.tipBox]}>
            {(
              [
                "comm_1",
                "comm_2_text",
                "comm_3",
                outOfCityContact
                  ? "comm_4_with_contact_pre"
                  : "comm_4_no_contact",
                "comm_5",
              ] as string[]
            ).map((key, i) => {
              const zhText =
                i === 3
                  ? outOfCityContact
                    ? `${pt(biMode, "comm_4_with_contact_pre")} ${outOfCityContact.name}（${outOfCityContact.phone}）${pt(biMode, "comm_4_with_contact_post")}`
                    : pt(biMode, "comm_4_no_contact")
                  : pt(biMode, key);
              const enText =
                i === 3
                  ? outOfCityContact
                    ? `${ptEn("comm_4_with_contact_pre")} ${outOfCityContact.name} (${outOfCityContact.phone})${ptEn("comm_4_with_contact_post")}`
                    : ptEn("comm_4_no_contact")
                  : ptEn(key);
              return (
                <View key={i} style={{ marginBottom: 2 }}>
                  <Text style={s.tipText}>{zhText}</Text>
                  {biMode === "bi" && (
                    <Text
                      style={[s.tipText, { fontSize: 7.5, color: "#6B6560" }]}
                    >
                      {enText}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* When phone doesn't work */}
          <Text style={s.sectionTitle}>{pt(biMode, "nophone_title")}</Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
              {ptEn("nophone_title")}
            </Text>
          )}
          <View
            style={[
              s.warningBox,
              {
                backgroundColor: "#fef2f2",
                borderWidth: 1,
                borderColor: "#fecaca",
              },
            ]}
          >
            {(
              [
                "nophone_1",
                "nophone_2",
                "nophone_3",
                "nophone_4",
                "nophone_5",
              ] as const
            ).map((key, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 3 }}>
                <Text style={{ color: "#C93B3B", marginRight: 5, fontSize: 9 }}>
                  {"·"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9 }}>{pt(biMode, key)}</Text>
                  {biMode === "bi" && (
                    <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                      {ptEn(key)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Emergency Contacts */}
          <Text style={s.sectionTitle}>{pt(biMode, "contacts_title")}</Text>
          {biMode === "bi" && (
            <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
              {ptEn("contacts_title")}
            </Text>
          )}
          {allContacts.map((c, i) => (
            <View key={i} style={s.contactCard}>
              <Text style={s.contactName}>
                {c.name}
                {pt(biMode, "label_contact_relation_wrap")}
                {c.relation}
                {pt(biMode, "label_contact_relation_wrap_end")}
              </Text>
              <Text style={s.contactPhone}>{c.phone}</Text>
              {c.phoneBackup ? (
                <Text style={s.contactMeta}>
                  {pt(biMode, "reunion_contact_backup")}
                  {biMode === "bi" ? "/" + ptEn("reunion_contact_backup") : ""}
                  ：{c.phoneBackup}
                </Text>
              ) : null}
              {c.isOutOfCity && (
                <View>
                  <Text
                    style={[
                      s.contactMeta,
                      { color: "#d4882a", fontWeight: "bold" },
                    ]}
                  >
                    {pt(biMode, "reunion_out_of_city")}
                  </Text>
                  {biMode === "bi" && (
                    <Text
                      style={[
                        s.contactMeta,
                        { color: "#d4882a", fontSize: 7.5 },
                      ]}
                    >
                      {ptEn("reunion_out_of_city")}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))}

          <Footer label={pt(biMode, "reunion_title")} biMode={biMode} />
        </Page>
      )}

      {/* ─── PAGES 4+: LOCATION EVACUATION GUIDES ─── */}
      {data.locations.map((loc, i) => (
        <LocationPage
          key={i}
          loc={loc}
          mapImg={mapImages?.[i]}
          biMode={biMode}
        />
      ))}

      {/* ─── COMBINED: MEMBER OVERVIEW (skip if no named members) ─── */}
      {allMembers.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text
            style={[
              s.scenarioTitle,
              { borderBottomColor: "#3b82f6", color: "#0D9488" },
            ]}
          >
            {pt(biMode, "member_title")}
          </Text>
          <Text style={{ fontSize: 9, color: "#6B6560", marginBottom: 6 }}>
            {pt(biMode, "member_desc_full")}
          </Text>

          {/* Shared info — everything that's identical across all members
              (emergency contact + hotlines, plus home address/shelter when
              no member has a different address). Pulled out of the cards to
              reclaim vertical space for per-member differentiators. */}
          {(() => {
            const emergContact = outOfCityContact ?? allContacts[0];
            const anyDifferentAddr = allMembers.some(
              (m) => m.hasDifferentAddress,
            );
            const sharedShelter = mainLocation?.shelters[0];
            return (
              <View
                style={{
                  backgroundColor: "#F7F5F3",
                  borderRadius: 6,
                  padding: "8 12",
                  marginBottom: 6,
                  borderWidth: 1,
                  borderColor: "#E8E4E0",
                }}
              >
                {!anyDifferentAddr && (
                  <>
                    <View style={s.pCardRow}>
                      <Text style={s.pCardLabel}>
                        {pt(biMode, "label_addr")}
                      </Text>
                      <Text style={s.pCardValue}>{fullAddr}</Text>
                    </View>
                    {sharedShelter ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_meeting_point")}
                        </Text>
                        <Text style={[s.pCardValue, { fontWeight: "bold" }]}>
                          {sharedShelter.name}
                          {sharedShelter.distance
                            ? `（${distText(sharedShelter.distance)}）`
                            : ""}
                        </Text>
                      </View>
                    ) : null}
                  </>
                )}
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>
                    {pt(biMode, "label_emergency_contact")}
                  </Text>
                  <Text style={[s.pCardValue, { fontWeight: "bold" }]}>
                    {emergContact
                      ? `${emergContact.name} ${emergContact.phone}`
                      : "＿＿＿＿＿＿"}
                  </Text>
                </View>
                <View style={s.pCardRow}>
                  <Text style={s.pCardLabel}>
                    {pt(biMode, "label_emergency_phone")}
                  </Text>
                  <Text style={s.pCardValue}>
                    {pt(biMode, "member_emerg_numbers")}
                  </Text>
                </View>
              </View>
            );
          })()}

          {allMembers.map((m, i) => {
            const memberHasOwnAddr = m.hasDifferentAddress;
            const addr = memberAddr(m, fullAddr);
            const loc = memberHasOwnAddr
              ? data.locations.find((l) => l.memberName === m.name)
              : mainLocation;
            const shelter = loc?.shelters[0];
            const anyDifferentAddr = allMembers.some(
              (mm) => mm.hasDifferentAddress,
            );
            return (
              <View key={i} style={s.pCard}>
                <View style={s.pCardHeader}>
                  <Text style={s.pCardName}>{m.name}</Text>
                  <Text style={s.pCardBlood}>
                    {pt(biMode, "label_blood_type")} {m.bloodType}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", marginTop: 2 }}>
                  <View style={{ flex: 1 }}>
                    {/* Only show address + shelter per-member when some member
                        has a different address (otherwise shared above). */}
                    {anyDifferentAddr && (
                      <>
                        <View style={s.pCardRow}>
                          <Text style={s.pCardLabel}>
                            {pt(biMode, "label_addr")}
                          </Text>
                          <Text style={s.pCardValue}>{addr}</Text>
                        </View>
                        <View style={s.pCardRow}>
                          <Text style={s.pCardLabel}>
                            {pt(biMode, "label_meeting_point")}
                          </Text>
                          <Text style={[s.pCardValue, { fontWeight: "bold" }]}>
                            {shelter?.name ?? "—"}
                            {shelter?.distance
                              ? `（${distText(shelter.distance)}）`
                              : ""}
                          </Text>
                        </View>
                      </>
                    )}
                    {m.birthYear ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_age")}
                        </Text>
                        <Text style={s.pCardValue}>
                          {new Date().getFullYear() - Number(m.birthYear)}{" "}
                          {pt(biMode, "label_years_old")}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    {m.medications ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_medication")}
                        </Text>
                        <Text
                          style={[
                            s.pCardValue,
                            { fontWeight: "bold", color: "#C93B3B" },
                          ]}
                        >
                          {m.medications}
                        </Text>
                      </View>
                    ) : null}
                    {m.allergies ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_allergy")}
                        </Text>
                        <Text
                          style={[
                            s.pCardValue,
                            { fontWeight: "bold", color: "#C93B3B" },
                          ]}
                        >
                          {m.allergies}
                        </Text>
                      </View>
                    ) : null}
                    {m.hasChronic ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_chronic")}
                        </Text>
                        <Text style={[s.pCardValue, { color: "#C93B3B" }]}>
                          {pt(biMode, "label_has_yes")}
                        </Text>
                      </View>
                    ) : null}
                    {m.isMobilityImpaired ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_mobility")}
                        </Text>
                        <Text style={[s.pCardValue, { color: "#C93B3B" }]}>
                          {pt(biMode, "label_mobility_impaired")}
                        </Text>
                      </View>
                    ) : null}
                    {m.specialNeeds ? (
                      <View style={s.pCardRow}>
                        <Text style={s.pCardLabel}>
                          {pt(biMode, "label_needs")}
                        </Text>
                        <Text style={s.pCardValue}>{m.specialNeeds}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}

          {mainHospital && (
            <View style={[s.tipBox, { marginTop: 4 }]}>
              <Text style={s.tipText}>
                {pt(biMode, "label_nearest_medical")}：{mainHospital.name}
                {mainHospital.hasER ? pt(biMode, "label_has_er_paren") : ""}
                {mainHospital.distance
                  ? `　${distText(mainHospital.distance)}`
                  : ""}
                {mainHospital.phone ? `　${mainHospital.phone}` : ""}
              </Text>
            </View>
          )}

          {/* Tear-off wallet card — standard business-card proportions (240×154pt
              ≈ 85×54mm). Carries the single household address, meeting point,
              out-of-city contact, and each member's blood type plus one alert
              (chronic meds or allergy), so the cardholder has the essentials
              an ER needs without the full A4 sheet. */}
          {(() => {
            const emergContact = outOfCityContact ?? allContacts[0];
            const shelter = mainLocation?.shelters[0];
            return (
              <View
                style={{
                  marginTop: 14,
                  width: 240,
                  height: 154,
                  padding: "10 12",
                  borderWidth: 1.2,
                  borderColor: "#9C9691",
                  borderStyle: "dashed",
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    color: "#9C9691",
                    marginBottom: 4,
                  }}
                >
                  ✂ {pt(biMode, "wallet_title")}
                </Text>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    color: "#0D9488",
                    marginBottom: 2,
                  }}
                >
                  {pt(biMode, "wallet_addr")}：{fullAddr}
                </Text>
                {shelter ? (
                  <Text
                    style={{
                      fontSize: 7.5,
                      marginBottom: 1,
                    }}
                  >
                    {pt(biMode, "wallet_meeting")}：{shelter.name}
                    {shelter.distance
                      ? `（${distText(shelter.distance)}）`
                      : ""}
                  </Text>
                ) : null}
                {emergContact ? (
                  <Text
                    style={{
                      fontSize: 7.5,
                      marginBottom: 3,
                    }}
                  >
                    {pt(biMode, "wallet_emerg")}：{emergContact.name}{" "}
                    {emergContact.phone}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontSize: 6.5,
                    color: "#6B6560",
                    marginBottom: 2,
                  }}
                >
                  {pt(biMode, "wallet_members")}
                </Text>
                {allMembers.map((m, i) => {
                  const alert =
                    m.medications ||
                    m.allergies ||
                    (m.hasChronic ? pt(biMode, "label_chronic") : "") ||
                    (m.isMobilityImpaired
                      ? pt(biMode, "label_mobility_impaired")
                      : "");
                  return (
                    <View
                      key={i}
                      style={{ flexDirection: "row", marginBottom: 1 }}
                    >
                      <Text
                        style={{
                          fontSize: 7.5,
                          fontWeight: "bold",
                          width: 58,
                        }}
                      >
                        {m.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 7.5,
                          color: "#C93B3B",
                          fontWeight: "bold",
                          width: 22,
                        }}
                      >
                        {m.bloodType}
                      </Text>
                      {alert ? (
                        <Text
                          style={{
                            fontSize: 7,
                            color: "#C93B3B",
                            flex: 1,
                          }}
                        >
                          {alert}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            );
          })()}

          <Footer label={pt(biMode, "member_footer")} biMode={biMode} />
        </Page>
      )}

      {/* ─── FOREIGN NATIONAL INFO ─── */}
      {household.isForeignNational &&
        (() => {
          const res = FOREIGN_RESOURCES.find(
            (r) => r.nationality === household.nationality,
          );
          return (
            <Page size="A4" style={s.page}>
              <Text
                style={[
                  s.scenarioTitle,
                  { borderBottomColor: "#0ea5e9", color: "#0ea5e9" },
                ]}
              >
                {biMode === "en"
                  ? "Information for Foreign Nationals"
                  : biMode === "zh"
                    ? pt(biMode, "foreign_title")
                    : `${pt(biMode, "foreign_title")} / Information for Foreign Nationals`}
              </Text>
              <Text style={{ fontSize: 9, color: "#6B6560", marginBottom: 8 }}>
                {biMode === "en"
                  ? ptEn("foreign_shelter_open")
                  : pt(biMode, "foreign_shelter_open")}
              </Text>
              {biMode === "bi" && (
                <Text
                  style={{ fontSize: 9, color: "#6B6560", marginBottom: 8 }}
                >
                  {ptEn("foreign_shelter_open")}
                </Text>
              )}

              <Text style={s.sectionTitle}>
                {biMode === "en"
                  ? "Multilingual Hotlines"
                  : biMode === "zh"
                    ? pt(biMode, "foreign_hotlines")
                    : `${pt(biMode, "foreign_hotlines")} / Multilingual Hotlines`}
              </Text>
              {FOREIGN_HOTLINES.map((h, i) => (
                <View key={i} style={s.numRow}>
                  <View style={{ width: 150, flexShrink: 0 }}>
                    <Text
                      style={{
                        fontSize: h.number.length > 4 ? 14 : 20,
                        fontWeight: "bold",
                        color: "#C93B3B",
                      }}
                    >
                      {h.number}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[s.numLabel, { fontWeight: "bold", fontSize: 9 }]}
                    >
                      {biMode === "en" ? h.nameEn : h.name}
                    </Text>
                    <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
                      {biMode === "bi" ? `${h.nameEn}　` : ""}
                      {h.note}
                    </Text>
                  </View>
                </View>
              ))}

              {res && (
                <>
                  <Text style={s.sectionTitle}>
                    {bi(biMode, "foreign_embassy_pre", "Representative Office")}{" "}
                    ({res.nameNative})
                  </Text>
                  <View style={s.contactCard}>
                    <Text style={s.contactName}>{res.embassy}</Text>
                    <Text style={s.contactPhone}>{res.embassyPhone}</Text>
                    <Text style={[s.contactMeta, { marginTop: 2 }]}>
                      {res.embassyAddress}
                    </Text>
                    {res.emergencyPhone && (
                      <Text
                        style={[
                          s.contactMeta,
                          {
                            color: "#C93B3B",
                            fontWeight: "bold",
                            marginTop: 2,
                          },
                        ]}
                      >
                        {bi(biMode, "foreign_emergency", "Emergency")}:{" "}
                        {res.emergencyPhone}
                      </Text>
                    )}
                  </View>
                </>
              )}

              {(household.employerName || household.brokerName) && (
                <>
                  <Text style={s.sectionTitle}>
                    {bi(biMode, "foreign_employer", "Employer / Broker")}
                  </Text>
                  {household.employerName && (
                    <View style={s.contactCard}>
                      <Text style={s.contactName}>
                        {bi(biMode, "foreign_employer_label", "Employer")}：
                        {household.employerName}
                      </Text>
                      {household.employerPhone && (
                        <Text style={s.contactPhone}>
                          {household.employerPhone}
                        </Text>
                      )}
                    </View>
                  )}
                  {household.brokerName && (
                    <View style={s.contactCard}>
                      <Text style={s.contactName}>
                        {bi(biMode, "foreign_broker_label", "Broker")}：
                        {household.brokerName}
                      </Text>
                      {household.brokerPhone && (
                        <Text style={s.contactPhone}>
                          {household.brokerPhone}
                        </Text>
                      )}
                    </View>
                  )}
                </>
              )}

              <Text style={s.sectionTitle}>
                {bi(biMode, "foreign_reminders", "Important Reminders")}
              </Text>
              <View
                style={[
                  s.warningBox,
                  {
                    backgroundColor: "#f0f9ff",
                    borderWidth: 1,
                    borderColor: "#bae6fd",
                  },
                ]}
              >
                {(biMode === "bi"
                  ? [
                      pt(biMode, "foreign_tip_1"),
                      ptEn("foreign_tip_1"),
                      pt(biMode, "foreign_tip_2"),
                      ptEn("foreign_tip_2"),
                      pt(biMode, "foreign_tip_3"),
                      ptEn("foreign_tip_3"),
                      pt(biMode, "foreign_tip_4"),
                      ptEn("foreign_tip_4"),
                    ]
                  : [
                      pt(biMode, "foreign_tip_1"),
                      pt(biMode, "foreign_tip_2"),
                      pt(biMode, "foreign_tip_3"),
                      pt(biMode, "foreign_tip_4"),
                    ]
                ).map((t, i) => {
                  // In bi mode: even = zh (main), odd = en (sub)
                  // In single mode: every line is main
                  const isSub = biMode === "bi" && i % 2 === 1;
                  return (
                    <View
                      key={i}
                      style={{ flexDirection: "row", marginBottom: 2 }}
                    >
                      <Text
                        style={{
                          color: "#0369a1",
                          marginRight: 5,
                          fontSize: 9,
                        }}
                      >
                        {isSub ? "　" : ">"}
                      </Text>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: isSub ? 8 : 9,
                          color: isSub ? "#64748b" : "#1e293b",
                        }}
                      >
                        {t}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Migrant Worker Health Centers (conditional) */}
              {(() => {
                const centers = mainLocation?.migrantHealthCenters ?? [];
                if (centers.length === 0) return null;
                return (
                  <View>
                    <Text
                      style={[
                        s.sectionTitle,
                        {
                          color: "#0369a1",
                          borderBottomColor: "#bae6fd",
                          marginTop: 6,
                        },
                      ]}
                    >
                      {pt(biMode, "migrant_health_title")}
                      {biMode === "bi"
                        ? " / " + ptEn("migrant_health_title")
                        : ""}
                    </Text>
                    <Text
                      style={{
                        fontSize: 7.5,
                        color: "#64748b",
                        marginBottom: 3,
                      }}
                    >
                      {pt(biMode, "migrant_health_desc")}
                    </Text>
                    {centers.slice(0, 3).map((c, i) => (
                      <View key={i} style={s.contactCard}>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "bold",
                            color: "#0369a1",
                          }}
                        >
                          {c.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 8,
                            color: "#475569",
                            marginTop: 1,
                          }}
                        >
                          {c.address}
                        </Text>
                        <Text
                          style={{
                            fontSize: 8.5,
                            color: "#c2410c",
                            marginTop: 1,
                            fontWeight: "bold",
                          }}
                        >
                          {c.phone}
                          {c.distance ? `　（${distText(c.distance)}）` : ""}
                        </Text>
                        {c.hours ? (
                          <Text
                            style={{
                              fontSize: 7,
                              color: "#64748b",
                              marginTop: 1,
                            }}
                          >
                            {c.hours}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                );
              })()}

              <Footer label="Foreign Nationals Info" biMode={biMode} />
            </Page>
          );
        })()}

      {/* ─── EMERGENCY PHRASE CARD (conditional on isForeignNational) ─── */}
      {household.isForeignNational &&
        (() => {
          return (
            <Page size="A4" style={s.page}>
              <Text
                style={[
                  s.scenarioTitle,
                  { borderBottomColor: "#0ea5e9", color: "#0369a1" },
                ]}
              >
                {pt(biMode, "phrase_card_title")} / {ptEn("phrase_card_title")}
              </Text>
              <Text style={{ fontSize: 9, color: "#6B6560", marginBottom: 6 }}>
                {pt(biMode, "phrase_card_sub")}
              </Text>

              {/* Header row with language labels */}
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: "#f0f9ff",
                  padding: "3 4",
                  borderRadius: 3,
                  marginBottom: 2,
                }}
              >
                {[
                  { w: 17, label: "中文" },
                  { w: 17, label: "English" },
                  { w: 17, label: "Tiếng Việt" },
                  { w: 17, label: "Bahasa" },
                  { w: 16, label: "ไทย" },
                  { w: 16, label: "Filipino" },
                ].map((col, i) => (
                  <Text
                    key={i}
                    style={{
                      width: `${col.w}%`,
                      fontSize: 6.5,
                      fontWeight: "bold",
                      color: "#0369a1",
                    }}
                  >
                    {col.label}
                  </Text>
                ))}
              </View>

              {PHRASE_CATEGORIES.map((cat) => {
                const catPhrases = MIGRANT_PHRASES.filter(
                  (p) => p.category === cat.id,
                );
                if (catPhrases.length === 0) return null;
                return (
                  <View key={cat.id} style={{ marginBottom: 2 }} wrap={false}>
                    <Text
                      style={{
                        fontSize: 7.5,
                        fontWeight: "bold",
                        color: "#0d9488",
                        backgroundColor: "#f0fdfa",
                        padding: "1.5 4",
                        marginBottom: 0.5,
                      }}
                    >
                      {pt(
                        biMode,
                        `phrase_cat_${cat.id}` as Parameters<typeof pt>[1],
                      )}{" "}
                      / {cat.en}
                    </Text>
                    {catPhrases.map((phrase) => (
                      <View
                        key={phrase.id}
                        style={{
                          flexDirection: "row",
                          paddingVertical: 0.5,
                          paddingHorizontal: 4,
                          borderBottomWidth: 0.5,
                          borderBottomColor: "#f1f5f9",
                        }}
                      >
                        <Text
                          style={{
                            width: "17%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                          }}
                        >
                          {phrase.text.zh}
                        </Text>
                        <Text
                          style={{
                            width: "17%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                            color: "#475569",
                          }}
                        >
                          {phrase.text.en}
                        </Text>
                        <Text
                          style={{
                            width: "17%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                            color: "#475569",
                          }}
                        >
                          {phrase.text.vi}
                        </Text>
                        <Text
                          style={{
                            width: "17%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                            color: "#475569",
                          }}
                        >
                          {phrase.text.id}
                        </Text>
                        <Text
                          style={{
                            width: "16%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                            color: "#475569",
                            fontFamily: "NotoSansThai",
                          }}
                        >
                          {phrase.text.th}
                        </Text>
                        <Text
                          style={{
                            width: "16%",
                            fontSize: 6.5,
                            lineHeight: 1.15,
                            color: "#475569",
                          }}
                        >
                          {phrase.text.fil}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}

              <Footer label="Emergency Phrase Card" biMode={biMode} />
            </Page>
          );
        })()}

      {/* ─── 72-HOUR SUPPLY CHECKLIST ─── */}
      <Page size="A4" style={s.page}>
        <Text
          style={[
            s.scenarioTitle,
            { borderBottomColor: "#16a34a", color: "#15803d" },
          ]}
        >
          {pt(biMode, "supply_title")}
        </Text>
        <Text style={{ fontSize: 9, color: "#6B6560", marginBottom: 2 }}>
          {pt(biMode, "supply_desc")}
        </Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.checkCat}>
              {pt(biMode, "supply_food")}（{allMembers.length}{" "}
              {pt(biMode, "supply_food_count")}）
            </Text>
            {(
              [
                `${pt(biMode, "chk_water_dynamic_pre")} ${allMembers.length * 6} ${pt(biMode, "chk_water_dynamic_unit")}`,
                pt(biMode, "chk_food_instant"),
                pt(biMode, "chk_food_rice"),
                household.hasInfant
                  ? `${pt(biMode, "chk_infant_formula_pre")}${household.infantInfo || pt(biMode, "infant_title").split(" —")[0]}${pt(biMode, "chk_infant_formula_post")}`
                  : pt(biMode, "chk_infant_formula_default"),
                household.hasInfant ? pt(biMode, "chk_infant_baby_food") : null,
                pt(biMode, "chk_utensils"),
                household.hasPets
                  ? `${pt(biMode, "chk_pet_supply_pre")}${household.petInfo || pt(biMode, "chk_pet_supply_default")}${pt(biMode, "chk_pet_supply_post")}`
                  : null,
              ] as (string | null)[]
            )
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={s.checkItem}>
                  <View style={s.checkbox} />
                  <Text style={s.checkText}>{item}</Text>
                </View>
              ))}

            <Text style={s.checkCat}>{pt(biMode, "supply_medical")}</Text>
            {(
              [
                pt(biMode, "chk_firstaid"),
                pt(biMode, "chk_painkillers"),
                ...allMembers
                  .filter((m) => m.medications)
                  .map(
                    (m) =>
                      `${m.name}${pt(biMode, "chk_meds_pre")}${m.medications}${pt(biMode, "chk_meds_post")}`,
                  ),
                ...allMembers
                  .filter((m) => m.allergies)
                  .map(
                    (m) =>
                      `${pt(biMode, "chk_allergy_pre")}${m.name}${pt(biMode, "chk_allergy_mid")}${m.allergies}）`,
                  ),
                pt(biMode, "chk_thermometer"),
                pt(biMode, "chk_masks"),
                pt(biMode, "chk_saline"),
                allMembers.some((m) => m.isMobilityImpaired)
                  ? pt(biMode, "chk_wheelchair")
                  : null,
              ] as (string | null)[]
            )
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={s.checkItem}>
                  <View style={s.checkbox} />
                  <Text style={s.checkText}>{item}</Text>
                </View>
              ))}

            <Text style={s.checkCat}>{pt(biMode, "supply_hygiene")}</Text>
            {(
              [
                pt(biMode, "chk_wipes"),
                pt(biMode, "chk_bags"),
                pt(biMode, "chk_hygiene"),
                household.hasInfant ? pt(biMode, "chk_infant_diapers") : null,
                household.hasInfant ? pt(biMode, "chk_infant_wipes") : null,
                household.hasInfant ? pt(biMode, "chk_infant_bottles") : null,
                household.hasInfant ? pt(biMode, "chk_infant_carrier") : null,
                household.hasInfant ? pt(biMode, "chk_infant_pacifier") : null,
                !household.hasInfant
                  ? pt(biMode, "chk_diapers_optional")
                  : null,
              ] as (string | null)[]
            )
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={s.checkItem}>
                  <View style={s.checkbox} />
                  <Text style={s.checkText}>{item}</Text>
                </View>
              ))}
          </View>

          <View style={s.col}>
            <Text style={s.checkCat}>{pt(biMode, "supply_comm")}</Text>
            {[
              pt(biMode, "chk_radio"),
              pt(biMode, "chk_flashlight"),
              pt(biMode, "chk_powerbank"),
              pt(biMode, "chk_whistle"),
              pt(biMode, "chk_glowstick"),
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, "supply_docs")}</Text>
            {[
              pt(biMode, "chk_id"),
              pt(biMode, "chk_bank"),
              pt(biMode, "chk_handbook"),
              pt(biMode, "chk_cash"),
              pt(biMode, "chk_waterproof"),
            ].map((item, i) => (
              <View key={i} style={s.checkItem}>
                <View style={s.checkbox} />
                <Text style={s.checkText}>{item}</Text>
              </View>
            ))}

            <Text style={s.checkCat}>{pt(biMode, "supply_clothes")}</Text>
            {(
              [
                `${pt(biMode, "chk_raincoat")} ${allMembers.length} ${pt(biMode, "chk_raincoat_unit")}`,
                pt(biMode, "chk_clothes"),
                pt(biMode, "chk_jacket"),
                pt(biMode, "chk_gloves"),
                pt(biMode, "chk_knife"),
                pt(biMode, "chk_rope"),
                pt(biMode, "chk_fire"),
                household.hasPets ? pt(biMode, "chk_pet_carrier") : null,
              ] as (string | null)[]
            )
              .filter(Boolean)
              .map((item, i) => (
                <View key={i} style={s.checkItem}>
                  <View style={s.checkbox} />
                  <Text style={s.checkText}>{item}</Text>
                </View>
              ))}
          </View>
        </View>
        <View style={[s.tipBox, { marginTop: 4 }]}>
          <Text style={s.tipText}>{pt(biMode, "supply_tip")}</Text>
        </View>

        {/* Refresh schedule — the thing users forget. Water expires, batteries
            leak, meds lose potency. Pairs with the half-yearly 定期檢查 on the
            next page (3 月 / 9 月). */}
        <View
          style={{
            marginTop: 10,
            padding: "10 12",
            borderRadius: 6,
            backgroundColor: "#F0FDFA",
            borderWidth: 1,
            borderColor: "#CCFBF1",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "bold",
              color: "#0D9488",
              marginBottom: 4,
            }}
          >
            {pt(biMode, "refresh_title")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {[
              pt(biMode, "refresh_water"),
              pt(biMode, "refresh_battery"),
              pt(biMode, "refresh_meds"),
              pt(biMode, "refresh_food"),
            ].map((t, i) => (
              <View
                key={i}
                style={{
                  width: "50%",
                  flexDirection: "row",
                  marginBottom: 3,
                }}
              >
                <Text style={{ fontSize: 9, color: "#0D9488", marginRight: 4 }}>
                  •
                </Text>
                <Text style={{ flex: 1, fontSize: 8.5 }}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <Footer label={pt(biMode, "supply_title")} biMode={biMode} />
      </Page>

      {/* ─── IMPORTANT REMINDERS ─── */}
      <Page size="A4" style={s.page}>
        <Text
          style={[
            s.scenarioTitle,
            { borderBottomColor: "#374151", color: "#2D2A26" },
          ]}
        >
          {pt(biMode, "remind_title")}
        </Text>

        <Text style={s.sectionTitle}>{pt(biMode, "remind_equip")}</Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
            {ptEn("remind_equip")}
          </Text>
        )}
        {[
          `${pt(biMode, "rem_gas")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_power")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_water")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_extinguisher")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_exit")}：＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_manager")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>
            {t}
          </Text>
        ))}

        <Text style={s.sectionTitle}>{pt(biMode, "remind_check")}</Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
            {ptEn("remind_check")}
          </Text>
        )}
        <Text style={{ fontSize: 9, color: "#6B6560", marginBottom: 4 }}>
          {pt(biMode, "remind_check_desc")}
        </Text>
        {[
          pt(biMode, "remind_chk_1"),
          pt(biMode, "remind_chk_2"),
          pt(biMode, "remind_chk_3"),
          pt(biMode, "remind_chk_4"),
          pt(biMode, "remind_chk_5"),
          pt(biMode, "remind_chk_6"),
          pt(biMode, "remind_chk_7"),
          pt(biMode, "remind_chk_8"),
          pt(biMode, "remind_chk_9"),
          pt(biMode, "remind_chk_10"),
        ].map((item, i) => (
          <View key={i} style={s.checkItem}>
            <View style={s.checkbox} />
            <Text style={s.checkText}>{item}</Text>
          </View>
        ))}

        <Text style={s.sectionTitle}>{pt(biMode, "remind_memo")}</Text>
        {biMode === "bi" && (
          <Text style={{ fontSize: 7.5, color: "#6B6560" }}>
            {ptEn("remind_memo")}
          </Text>
        )}
        {[
          `${pt(biMode, "rem_doctor")}：＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_insurance")}：＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_plate")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_pet_chip")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
          `${pt(biMode, "rem_other")}：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿`,
        ].map((t, i) => (
          <Text key={i} style={{ fontSize: 10, marginBottom: 6 }}>
            {t}
          </Text>
        ))}

        <View style={[s.tipBox, { marginTop: 8 }]}>
          <Text style={s.tipText}>{pt(biMode, "remind_final")}</Text>
        </View>

        <Footer label={pt(biMode, "remind_title")} biMode={biMode} />
      </Page>
    </Document>
  );
}
