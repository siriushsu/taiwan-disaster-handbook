"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import MemberForm from "@/components/form/MemberForm";
import ContactForm from "@/components/form/ContactForm";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { DISTRICTS } from "@/lib/districts";
import { DISTRICTS_EN } from "@/lib/districts-en";
import { CITIES } from "@/lib/cities";
import { t, LOCALES, type Locale } from "@/lib/i18n";
import { FOREIGN_RESOURCES } from "@/lib/foreign-resources";
import type {
  HouseholdForm,
  Member,
  EmergencyContact,
  HandbookData,
  Shelter,
  MedicalFacility,
  AedLocation,
} from "@/types";
import { APP_VERSION } from "@/lib/version";

const MapExplorer = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <p>載入地圖...</p>
    </div>
  ),
});

const defaultMember = (): Member => ({
  name: "",
  phone: "",
  birthYear: "",
  bloodType: "不知道",
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
});

const defaultContact = (): EmergencyContact => ({
  name: "",
  relation: "",
  phone: "",
  phoneBackup: "",
  isOutOfCity: false,
});

// CITIES imported from @/lib/cities

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh-TW");
  const T = (key: Parameters<typeof t>[1], vars?: Record<string, string>) =>
    t(locale, key, vars);
  // "landing" = hero page, "quick" = quick lookup, "form" = full form
  const [mode, setMode] = useState<"landing" | "quick" | "form" | "map">(
    "landing",
  );
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [showSupport, setShowSupport] = useState(false);
  const [isLineApp, setIsLineApp] = useState(false);
  // Pre-queried location from map click (bypasses geocoding in generateHandbook)
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
    shelters: Shelter[];
    airRaid: Shelter[];
    medical: MedicalFacility[];
    aed: AedLocation[];
    erHospital: MedicalFacility[];
    fireStation: import("@/types").FireStation[];
    policeStation: import("@/types").PoliceStation[];
  } | null>(null);
  // Track which member field opened the map (for filling back address)
  const [mapTarget, setMapTarget] = useState<{
    type: "main" | "daily" | "address" | "contact";
    memberIndex: number;
  } | null>(null);
  // Quick lookup state
  const [quickCity, setQuickCity] = useState("臺北市");
  const [quickDistrict, setQuickDistrict] = useState("");
  const [quickAddress, setQuickAddress] = useState("");
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickResult, setQuickResult] = useState<{
    shelters: Shelter[];
    airRaid: Shelter[];
    medical: MedicalFacility[];
    aed: AedLocation[];
    fireStation: import("@/types").FireStation[];
    policeStation: import("@/types").PoliceStation[];
  } | null>(null);

  useEffect(() => {
    if (/Line\//i.test(navigator.userAgent)) setIsLineApp(true);
  }, []);

  // Hydrate locale from ?lang= query param on first load (shareable URLs).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");
    if (lang && (LOCALES as readonly string[]).includes(lang)) {
      setLocale(lang as Locale);
    }
  }, []);

  // When locale changes, mirror it to the URL (zh-TW is default → no param).
  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    const params = new URLSearchParams(window.location.search);
    if (newLocale === "zh-TW") {
      params.delete("lang");
    } else {
      params.set("lang", newLocale);
    }
    const query = params.toString();
    const url = window.location.pathname + (query ? `?${query}` : "");
    window.history.replaceState(null, "", url);
  };

  const [form, setForm] = useState<HouseholdForm>({
    address: "",
    city: "臺北市",
    district: "",
    housingType: "apartment",
    floor: "" as string,
    hasPets: false,
    petInfo: "",
    hasInfant: false,
    infantInfo: "",
    isForeignNational: false,
    foreignType: "" as "resident" | "worker" | "",
    nationality: "",
    employerName: "",
    employerPhone: "",
    brokerName: "",
    brokerPhone: "",
    members: [defaultMember()],
    contacts: [defaultContact()],
  });

  const updateForm = (field: keyof HouseholdForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateMember = (i: number, m: Member) =>
    setForm((prev) => {
      const members = [...prev.members];
      members[i] = m;
      return { ...prev, members };
    });

  const updateContact = (i: number, c: EmergencyContact) =>
    setForm((prev) => {
      const contacts = [...prev.contacts];
      contacts[i] = c;
      return { ...prev, contacts };
    });

  // 對單一地址進行 geocode + 查詢附近設施（純前端，不經過 API）
  const queryLocation = async (
    address: string,
    city: string,
    district?: string,
  ) => {
    const { geocode, findNearby } = await import("@/lib/client-lookup");
    let geo = null;
    let shelters: Shelter[] = [];
    let airRaid: Shelter[] = [];
    let medical: MedicalFacility[] = [];
    let aed: AedLocation[] = [];
    let erHospital: MedicalFacility[] = [];
    let fireStation: import("@/types").FireStation[] = [];
    let policeStation: import("@/types").PoliceStation[] = [];
    try {
      geo = await geocode(address, { city, district });
    } catch {
      /* geocoding 失敗，跳過 */
    }

    if (geo?.lat && geo?.lng) {
      try {
        const result = await findNearby(geo.lat, geo.lng);
        shelters = result.shelters;
        airRaid = result.airRaid;
        medical = result.medical;
        aed = result.aed || [];
        erHospital = result.erHospital || [];
        fireStation = result.fireStation || [];
        policeStation = result.policeStation || [];
      } catch {
        /* 查詢失敗，跳過 */
      }
    }
    return {
      geo,
      shelters,
      airRaid,
      medical,
      aed,
      erHospital,
      fireStation,
      policeStation,
    };
  };

  const generateHandbook = async () => {
    setLoading(true);
    setError("");
    try {
      // 收集所有需要查詢的地址
      const addressTargets = [
        {
          label: "主住家",
          address: `${form.city}${form.district}${form.address}`,
          city: form.city,
          district: form.district,
          housingType: form.housingType,
          floor: form.floor,
          memberName: undefined as string | undefined,
        },
        ...form.members
          .filter((m) => m.name && m.hasDifferentAddress && m.city && m.address)
          .map((m) => ({
            label: `${m.name} 的住所`,
            address: `${m.city}${m.district}${m.address}`,
            city: m.city,
            district: m.district,
            housingType: undefined as
              | "apartment"
              | "house"
              | "rural"
              | undefined,
            floor: undefined as string | undefined,
            memberName: m.name,
          })),
        ...form.members
          .filter((m) => m.name && m.dailyCity && m.dailyAddress)
          .map((m) => ({
            label: `${m.name}${m.dailyLocation ? `（${m.dailyLocation}）` : ""} 白天地點`,
            address: `${m.dailyCity}${m.dailyDistrict}${m.dailyAddress}`,
            city: m.dailyCity,
            district: m.dailyDistrict,
            housingType: undefined as
              | "apartment"
              | "house"
              | "rural"
              | undefined,
            floor: undefined as string | undefined,
            memberName: m.name,
          })),
      ];

      const locations: import("@/types").LocationInfo[] = [];
      for (let i = 0; i < addressTargets.length; i++) {
        const t = addressTargets[i];
        setLoadingMsg(
          `查詢地址 ${i + 1}/${addressTargets.length}：${t.label}...`,
        );

        // Use pre-queried map data for the primary address if available
        if (i === 0 && mapLocation) {
          locations.push({
            label: t.label,
            memberName: t.memberName,
            address: t.address,
            city: t.city,
            district: t.district,
            housingType: t.housingType,
            floor: t.floor,
            geo: {
              lat: mapLocation.lat,
              lng: mapLocation.lng,
              formattedAddress: t.address,
            },
            shelters: mapLocation.shelters,
            airRaid: mapLocation.airRaid,
            medical: mapLocation.medical,
            aed: mapLocation.aed,
            erHospital: mapLocation.erHospital,
            fireStation: mapLocation.fireStation,
            policeStation: mapLocation.policeStation,
          });
          continue;
        }

        const {
          geo,
          shelters,
          airRaid,
          medical,
          aed,
          erHospital,
          fireStation,
          policeStation,
        } = await queryLocation(t.address, t.city, t.district);
        locations.push({
          label: t.label,
          memberName: t.memberName,
          address: t.address,
          city: t.city,
          district: t.district,
          housingType: t.housingType,
          floor: t.floor,
          geo,
          shelters,
          airRaid,
          medical,
          aed,
          erHospital,
          fireStation,
          policeStation,
        });
      }

      setLoadingMsg("正在生成手冊...");
      const handbookData: HandbookData = {
        household: form,
        locations,
        generatedAt: new Date().toLocaleDateString("zh-TW"),
      };
      try {
        sessionStorage.setItem("handbookData", JSON.stringify(handbookData));
      } catch {
        // sessionStorage quota exceeded or not available - try clearing old data
        sessionStorage.clear();
        sessionStorage.setItem("handbookData", JSON.stringify(handbookData));
      }
      window.location.href = "/handbook";
    } catch (e) {
      console.error("Generate error:", e);
      setError(
        e instanceof Error ? e.message : "發生錯誤，請確認網路連線後再試一次",
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLookup = async () => {
    if (!quickCity || !quickAddress) return;
    setQuickLoading(true);
    setQuickResult(null);
    setError("");
    try {
      const fullAddr = `${quickCity}${quickDistrict}${quickAddress}`;
      const result = await queryLocation(fullAddr, quickCity, quickDistrict);
      setQuickResult({
        shelters: result.shelters,
        airRaid: result.airRaid,
        medical: result.medical,
        aed: result.aed,
        fireStation: result.fireStation,
        policeStation: result.policeStation,
      });
    } catch {
      setError("查詢失敗，請確認地址後再試");
    } finally {
      setQuickLoading(false);
    }
  };

  const runDemo = async () => {
    setMode("quick");
    setQuickCity("臺北市");
    setQuickDistrict("信義區");
    setQuickAddress("信義路五段7號");
    setQuickLoading(true);
    setQuickResult(null);
    try {
      const result = await queryLocation(
        "臺北市信義區信義路五段7號",
        "臺北市",
        "信義區",
      );
      setQuickResult({
        shelters: result.shelters,
        airRaid: result.airRaid,
        medical: result.medical,
        aed: result.aed,
        fireStation: result.fireStation,
        policeStation: result.policeStation,
      });
    } catch {
      setError("查詢失敗");
    } finally {
      setQuickLoading(false);
    }
  };

  const quickToFullForm = () => {
    setForm((prev) => ({
      ...prev,
      city: quickCity,
      district: quickDistrict,
      address: quickAddress,
    }));
    setMode("form");
    setStep(2); // Skip address step — already entered in quick lookup
  };

  return (
    <main className="min-h-screen bg-surface">
      {/* 頁首 — Notion-style white header */}
      {form.isForeignNational && mode === "form" && (
        <div
          className={`${form.foreignType === "worker" ? "bg-mode-worker" : "bg-mode-resident"} text-white text-center text-xs py-1.5 font-medium`}
        >
          {form.foreignType === "worker"
            ? "🌏 外籍移工模式 Migrant Worker Mode — 1955 / 113 / 用語卡 / 雇主資訊"
            : form.foreignType === "resident"
              ? "🌏 外籍居民模式 Foreign Resident Mode — 辦事處 / 用語卡"
              : "🌏 請選擇身分類型 Please select your status below"}
        </div>
      )}
      <div className="bg-white border-b border-border py-4 px-4 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Header brand: H1 only off-landing (where no content hero exists).
                On landing, page hero below is the H1 — see section below. */}
            {mode === "landing" ? (
              <p
                className="font-bold text-primary text-xl"
                aria-label={
                  locale === "en"
                    ? "Taiwan Emergency Handbook"
                    : "台灣家庭防災手冊"
                }
              >
                {locale === "en"
                  ? "Taiwan Emergency Handbook"
                  : "台灣家庭防災手冊"}
              </p>
            ) : (
              <h1
                className="font-bold text-primary text-base cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => {
                  setMode("landing");
                  setStep(1);
                  setQuickResult(null);
                  setMapLocation(null);
                }}
              >
                {locale === "en"
                  ? "Taiwan Emergency Handbook"
                  : "台灣家庭防災手冊"}
              </h1>
            )}
            <LocaleSwitcher locale={locale} onChange={handleLocaleChange} />
          </div>
        </div>
      </div>

      {/* LINE 內建瀏覽器警告 */}
      {isLineApp && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm">
            <p className="font-bold text-warning mb-2">⚠️ 請用外部瀏覽器開啟</p>
            <p className="text-warning/90 text-xs mb-3">
              LINE 內建瀏覽器無法下載 PDF，請依以下步驟操作：
            </p>
            <ol className="text-xs text-text space-y-1.5 mb-3 list-none pl-0">
              <li>
                1️⃣ 點擊右下角 <span className="font-bold">「⋯」</span> 按鈕
              </li>
              <li>
                2️⃣ 選擇{" "}
                <span className="font-bold">「在預設瀏覽器中開啟」</span>
              </li>
            </ol>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                  alert(
                    "已複製網址！請打開 Safari 或 Chrome，貼上網址即可使用。",
                  );
                });
              }}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold"
            >
              或點此複製網址
            </button>
          </div>
        </div>
      )}

      {/* === LANDING MODE === */}
      {mode === "landing" && (
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Hero — H1 + supporting desc centered; utility row below breaks
              the 'everything centered' AI-slop rhythm with tiered alignment. */}
          <div className="text-center space-y-2 pt-2">
            <h1 className="text-3xl font-bold text-text leading-tight">
              {T("site_title")}
            </h1>
            <p className="text-base text-text-muted">{T("site_desc")}</p>
          </div>
          {/* Utility row — privacy note + migrant CTA. Left-aligned so they
              read as 'helper' tier, not hero. */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-text-faint">{T("privacy_notice")}</p>
            <button
              onClick={() => {
                setForm((prev) => ({ ...prev, isForeignNational: true }));
                setMode("form");
                setStep(1);
              }}
              className="inline-flex items-center min-h-[44px] text-xs text-primary hover:text-primary-dark underline-offset-2 hover:underline self-start"
            >
              {T("quick_cta_migrant")}
            </button>
          </div>

          {/* Data stats */}
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["6,300+", T("hero_stat_shelters")],
                ["74,000+", T("hero_stat_airraid")],
                ["16,900+", T("hero_stat_medical")],
                ["15,000+", T("hero_stat_aed")],
              ] as const
            ).map(([num, label]) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-border p-3 text-center shadow-card"
              >
                <p className="text-xl font-bold text-primary">{num}</p>
                <p className="text-xs text-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* PDF preview — shows users exactly what artifact they'll get,
              before they commit to the primary CTA. Pre-rendered at build
              time via `npm run gen:pdf-preview`. */}
          <div className="bg-white rounded-xl border border-border p-4 shadow-card">
            <p className="text-xs text-text-faint mb-2">
              {T("preview_caption")}
            </p>
            <Image
              src="/pdf-preview.png"
              alt="PDF handbook preview"
              width={1191}
              height={1684}
              className="rounded-md border border-border/50 w-full h-auto"
              priority
            />
          </div>

          {/* Primary CTA */}
          <button
            onClick={() => setMode("quick")}
            className="w-full bg-primary text-white py-4 rounded-lg font-semibold text-lg hover:bg-primary-dark transition-all active:scale-[0.98]"
          >
            {T("hero_cta_quick")}
          </button>

          {/* Secondary CTAs */}
          <div className="flex gap-3">
            <button
              onClick={runDemo}
              className="flex-1 border border-border text-text py-3 rounded-lg font-medium text-sm hover:bg-surface-muted transition-all active:scale-[0.98]"
            >
              {T("hero_cta_demo")}
            </button>
            <button
              onClick={() => setMode("map")}
              className="flex-1 border border-border text-text py-3 rounded-lg font-medium text-sm hover:bg-surface-muted transition-all active:scale-[0.98]"
            >
              {T("find_on_map")}
            </button>
          </div>
          <button
            onClick={() => setMode("form")}
            className="w-full text-text-muted text-sm min-h-[44px] py-2 hover:text-text transition-colors"
          >
            {T("hero_cta_full")}
          </button>

          {/* Emergency quick link — ghost style so primary CTA keeps hierarchy */}
          <a
            href="/emergency"
            className="block w-full text-center bg-white border border-red-600 text-red-600 py-3 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors active:scale-[0.98]"
          >
            {T("emergency_cta")}
          </a>
        </div>
      )}

      {/* === QUICK LOOKUP MODE === */}
      {mode === "quick" && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-border space-y-4">
            {quickResult ? (
              /* Results showing — compact address bar */
              <div className="flex items-center justify-between">
                <p className="text-sm text-text">
                  <span className="font-semibold">
                    {quickCity}
                    {quickDistrict}
                    {quickAddress}
                  </span>
                </p>
                <button
                  onClick={() => {
                    setQuickResult(null);
                  }}
                  className="text-xs text-primary hover:text-primary-dark underline shrink-0 ml-2"
                >
                  {T("change_addr")}
                </button>
              </div>
            ) : (
              /* No results yet — full input form */
              <>
                <h2 className="text-lg font-bold text-text">
                  {T("quick_title")}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={quickCity}
                    onChange={(e) => {
                      setQuickCity(e.target.value);
                      setQuickDistrict("");
                    }}
                    className="border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    {CITIES.map(([zh, en]) => (
                      <option key={zh} value={zh}>
                        {locale === "zh-TW" ? zh : `${en} ${zh}`}
                      </option>
                    ))}
                  </select>
                  <select
                    value={quickDistrict}
                    onChange={(e) => setQuickDistrict(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    <option value="">{T("select_please")}</option>
                    {(DISTRICTS[quickCity] ?? []).map((d) => (
                      <option key={d} value={d}>
                        {locale === "zh-TW"
                          ? d
                          : `${DISTRICTS_EN[d] || d} ${d}`}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && quickLookup()}
                  placeholder={T("address_placeholder")}
                  className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
                <div className="flex gap-2">
                  <button
                    onClick={quickLookup}
                    disabled={quickLoading || !quickAddress}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
                  >
                    {quickLoading ? T("quick_searching") : T("search_btn")}
                  </button>
                  <button
                    onClick={() => setMode("map")}
                    className="border-2 border-primary text-primary px-4 py-3 rounded-lg font-semibold text-sm hover:bg-primary-light transition-colors whitespace-nowrap"
                  >
                    {T("map_short")}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Results */}
          {quickResult && (
            <div className="bg-white rounded-xl shadow-sm p-5 border border-border space-y-4">
              <h3 className="font-bold text-text">{T("quick_result_title")}</h3>

              {quickResult.shelters.length === 0 &&
              quickResult.airRaid.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {T("quick_no_result")}
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Category rows: colored dot carries the category cue.
                      Drops the 4px colored left-border (AI-slop pattern #8)
                      while keeping the same semantic color mapping. */}
                  {quickResult.shelters[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-primary shrink-0"
                          aria-hidden
                        />
                        {T("quick_result_nearest_shelter")}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {quickResult.shelters[0].name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {quickResult.shelters[0].address} /{" "}
                        {quickResult.shelters[0].distance}
                      </p>
                    </div>
                  )}
                  {quickResult.airRaid[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-warning shrink-0"
                          aria-hidden
                        />
                        {T("quick_result_nearest_airraid")}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {quickResult.airRaid[0].name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {quickResult.airRaid[0].address} /{" "}
                        {quickResult.airRaid[0].distance}
                      </p>
                    </div>
                  )}
                  {quickResult.medical[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-success shrink-0"
                          aria-hidden
                        />
                        {T("quick_result_nearest_medical")}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {quickResult.medical[0].name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {quickResult.medical[0].address}
                      </p>
                    </div>
                  )}
                  {quickResult.aed[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-accent shrink-0"
                          aria-hidden
                        />
                        {T("quick_result_nearest_aed")}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {(quickResult.aed[0] as AedLocation).name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {(quickResult.aed[0] as AedLocation).address}
                      </p>
                    </div>
                  )}
                  {quickResult.fireStation?.[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-error shrink-0"
                          aria-hidden
                        />
                        {locale === "en"
                          ? "Nearest fire station"
                          : "最近消防隊"}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {quickResult.fireStation[0].name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {quickResult.fireStation[0].address} /{" "}
                        {quickResult.fireStation[0].phone}
                      </p>
                    </div>
                  )}
                  {quickResult.policeStation?.[0] && (
                    <div>
                      <p className="text-xs text-text-faint flex items-center gap-1.5">
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full bg-info shrink-0"
                          aria-hidden
                        />
                        {locale === "en"
                          ? "Nearest police station"
                          : "最近派出所"}
                      </p>
                      <p className="font-semibold text-text text-sm">
                        {quickResult.policeStation[0].name}
                      </p>
                      <p className="text-xs text-text-muted">
                        {quickResult.policeStation[0].address} /{" "}
                        {quickResult.policeStation[0].phone}
                      </p>
                    </div>
                  )}

                  {/* Show counts */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary">
                        {quickResult.shelters.length}
                      </p>
                      <p className="text-[10px] text-text-faint">
                        {T("stat_shelters_short")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-warning">
                        {quickResult.airRaid.length}
                      </p>
                      <p className="text-[10px] text-text-faint">
                        {T("stat_airraid_short")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-success">
                        {quickResult.medical.length}
                      </p>
                      <p className="text-[10px] text-text-faint">
                        {T("stat_medical_short")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-accent">
                        {quickResult.aed.length}
                      </p>
                      <p className="text-[10px] text-text-faint">AED</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={quickToFullForm}
                className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                {T("quick_make_handbook")}
              </button>
              <button
                onClick={() => {
                  setQuickResult(null);
                  setQuickAddress("");
                }}
                className="w-full text-text-muted text-sm py-1 hover:text-text transition-colors"
              >
                {T("quick_try_another")}
              </button>
            </div>
          )}

          <button
            onClick={() => setMode("landing")}
            className="w-full text-text-faint text-xs py-1 hover:text-text-muted transition-colors"
          >
            {T("back_to_home")}
          </button>
        </div>
      )}

      {/* === MAP MODE === */}
      {mode === "map" && (
        <MapExplorer
          onBack={() => {
            setMode(mapTarget ? "form" : "landing");
            setMapTarget(null);
          }}
          onUseLocation={async (lat, lng) => {
            const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

            if (mapTarget?.type === "daily") {
              // Fill back daily address — also try reverse geocode for city/district
              const m = { ...form.members[mapTarget.memberIndex] };
              m.dailyAddress = coordStr;
              if (!m.dailyLocation) m.dailyLocation = "上班";
              // Set a placeholder city so the address field is visible
              if (!m.dailyCity) m.dailyCity = "（地圖定位）";
              try {
                const res = await fetch(
                  `/api/geocode?address=${lat},${lng}&reverse=1`,
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data.formattedAddress) {
                    m.dailyAddress = data.formattedAddress;
                    // Extract city from formatted address
                    for (const c of [
                      "臺北市",
                      "新北市",
                      "桃園市",
                      "臺中市",
                      "臺南市",
                      "高雄市",
                      "基隆市",
                      "新竹市",
                      "嘉義市",
                      "新竹縣",
                      "苗栗縣",
                      "彰化縣",
                      "南投縣",
                      "雲林縣",
                      "嘉義縣",
                      "屏東縣",
                      "宜蘭縣",
                      "花蓮縣",
                      "臺東縣",
                      "澎湖縣",
                      "金門縣",
                      "連江縣",
                    ]) {
                      if (data.formattedAddress.includes(c)) {
                        m.dailyCity = c;
                        break;
                      }
                    }
                  }
                }
              } catch {
                /* reverse geocode failed, keep coordinates */
              }
              updateMember(mapTarget.memberIndex, m);
              setMapTarget(null);
              setMode("form");
              return;
            }

            if (mapTarget?.type === "address") {
              // Fill back different address — also try reverse geocode
              const m = { ...form.members[mapTarget.memberIndex] };
              m.address = coordStr;
              if (!m.city) m.city = "（地圖定位）";
              try {
                const res = await fetch(
                  `/api/geocode?address=${lat},${lng}&reverse=1`,
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data.formattedAddress) {
                    m.address = data.formattedAddress;
                    for (const c of [
                      "臺北市",
                      "新北市",
                      "桃園市",
                      "臺中市",
                      "臺南市",
                      "高雄市",
                      "基隆市",
                      "新竹市",
                      "嘉義市",
                      "新竹縣",
                      "苗栗縣",
                      "彰化縣",
                      "南投縣",
                      "雲林縣",
                      "嘉義縣",
                      "屏東縣",
                      "宜蘭縣",
                      "花蓮縣",
                      "臺東縣",
                      "澎湖縣",
                      "金門縣",
                      "連江縣",
                    ]) {
                      if (data.formattedAddress.includes(c)) {
                        m.city = c;
                        break;
                      }
                    }
                  }
                }
              } catch {
                /* keep coordinates */
              }
              updateMember(mapTarget.memberIndex, m);
              setMapTarget(null);
              setMode("form");
              return;
            }

            if (mapTarget?.type === "contact") {
              // Fill back address for emergency contact with reverse geocode
              const c = { ...form.contacts[mapTarget.memberIndex] };
              c.address = coordStr;
              try {
                const res = await fetch(
                  `/api/geocode?address=${lat},${lng}&reverse=1`,
                );
                if (res.ok) {
                  const data = await res.json();
                  if (data.formattedAddress) c.address = data.formattedAddress;
                }
              } catch {
                /* keep coordinates */
              }
              updateContact(mapTarget.memberIndex, c);
              setMapTarget(null);
              setMode("form");
              setStep(3);
              return;
            }

            // Default: main address — store pre-queried data
            const { findNearby } = await import("@/lib/client-lookup");
            const result = await findNearby(lat, lng);
            setMapLocation({
              lat,
              lng,
              shelters: result.shelters,
              airRaid: result.airRaid,
              medical: result.medical,
              aed: result.aed || [],
              erHospital: result.erHospital || [],
              fireStation: result.fireStation || [],
              policeStation: result.policeStation || [],
            });
            updateForm("address", coordStr);
            setMapTarget(null);
            setMode("form");
            setStep(2);
          }}
          locale={locale}
        />
      )}

      {/* === FULL FORM MODE === */}
      {mode === "form" && (
        <>
          {/* 步驟指示器 */}
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex gap-2">
              {[
                { n: 1, label: T("step1") },
                { n: 2, label: T("step2") },
                { n: 3, label: T("step3") },
              ].map(({ n, label }) => (
                <div
                  key={n}
                  className={`flex-1 flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    step === n
                      ? "bg-primary text-white"
                      : step > n
                        ? "bg-primary-light text-primary"
                        : "bg-white text-text-faint"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      step === n
                        ? "bg-white text-primary"
                        : step > n
                          ? "bg-success text-white"
                          : "bg-surface-muted text-text-faint"
                    }`}
                  >
                    {n}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 pb-12">
            {/* Step 1: 住家資訊 */}
            {step === 1 && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
                <h2 className="text-lg font-bold text-text">{T("step1")}</h2>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    {T("city")}
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        city: e.target.value,
                        district: "",
                      }))
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    {CITIES.map(([zh, en]) => (
                      <option key={zh} value={zh}>
                        {locale === "zh-TW" ? zh : `${en} ${zh}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    {T("district")}
                  </label>
                  <select
                    value={form.district}
                    onChange={(e) => updateForm("district", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    <option value="">{T("select_please")}</option>
                    {(DISTRICTS[form.city] ?? []).map((d) => (
                      <option key={d} value={d}>
                        {locale === "zh-TW"
                          ? d
                          : `${DISTRICTS_EN[d] || d} ${d}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">
                    {T("address")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateForm("address", e.target.value)}
                      placeholder={T("address_placeholder")}
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                    <button
                      type="button"
                      onClick={() => setMode("map")}
                      className="border-2 border-primary text-primary px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors shrink-0"
                    >
                      📍
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">
                      {T("housing_type")}
                    </label>
                    <select
                      value={form.housingType}
                      onChange={(e) =>
                        updateForm("housingType", e.target.value)
                      }
                      className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                    >
                      <option value="apartment">{T("apartment")}</option>
                      <option value="house">{T("house")}</option>
                      <option value="rural">{T("rural")}</option>
                    </select>
                  </div>
                  {form.housingType === "apartment" && (
                    <div>
                      <label className="block text-sm font-medium text-text-muted mb-1">
                        {T("floor")}
                      </label>
                      <input
                        type="text"
                        value={form.floor}
                        onChange={(e) => updateForm("floor", e.target.value)}
                        placeholder="例：8、B1、B2"
                        className="w-full border border-border rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-text-muted">
                    <input
                      type="checkbox"
                      checked={form.hasPets}
                      onChange={(e) => updateForm("hasPets", e.target.checked)}
                      className="rounded"
                    />
                    {T("has_pets")}
                  </label>
                  {form.hasPets && (
                    <input
                      type="text"
                      value={form.petInfo}
                      onChange={(e) => updateForm("petInfo", e.target.value)}
                      placeholder="例：柯基犬 1 隻、貓 2 隻"
                      className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm text-text-muted">
                    <input
                      type="checkbox"
                      checked={form.hasInfant}
                      onChange={(e) =>
                        updateForm("hasInfant", e.target.checked)
                      }
                      className="rounded"
                    />
                    家中有嬰幼兒（3 歲以下）
                  </label>
                  {form.hasInfant && (
                    <input
                      type="text"
                      value={form.infantInfo}
                      onChange={(e) => updateForm("infantInfo", e.target.value)}
                      placeholder="例：1 歲男嬰、需要特殊配方奶"
                      className="mt-2 w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                    />
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-2 text-sm text-text-muted">
                    <input
                      type="checkbox"
                      checked={form.isForeignNational}
                      onChange={(e) => {
                        updateForm("isForeignNational", e.target.checked);
                        if (!e.target.checked) updateForm("foreignType", "");
                      }}
                      className="rounded mt-1"
                    />
                    <div>
                      <div>外籍人士 / Foreign National</div>
                      <div className="text-xs text-text-faint mt-0.5 leading-snug">
                        勾選後可選擇身分類型，加入對應的專屬資源
                        <br />
                        Check to select your status and enable relevant
                        resources
                      </div>
                    </div>
                  </label>
                  {form.isForeignNational && (
                    <div className="mt-3 space-y-3 bg-primary-light rounded-lg p-3">
                      {/* Sub-selection: resident vs worker */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateForm("foreignType", "resident")}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                            form.foreignType === "resident"
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-text-muted border-border hover:border-primary"
                          }`}
                        >
                          <div>外籍居民</div>
                          <div className="text-xs opacity-75">
                            Foreign Resident
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateForm("foreignType", "worker")}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                            form.foreignType === "worker"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white text-text-muted border-border hover:border-emerald-600"
                          }`}
                        >
                          <div>外籍移工</div>
                          <div className="text-xs opacity-75">
                            Migrant Worker
                          </div>
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-muted mb-1">
                          國籍 Nationality
                        </label>
                        <select
                          value={form.nationality}
                          onChange={(e) =>
                            updateForm("nationality", e.target.value)
                          }
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light"
                        >
                          <option value="">請選擇 / Select</option>
                          {FOREIGN_RESOURCES.map((r) => (
                            <option key={r.nationality} value={r.nationality}>
                              {r.nameZh} {r.nameNative}
                            </option>
                          ))}
                          <option value="OTHER">其他 / Other</option>
                        </select>
                      </div>
                      {/* Employer/Broker fields — only for migrant workers */}
                      {form.foreignType === "worker" && (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1">
                                雇主姓名 Employer
                              </label>
                              <input
                                type="text"
                                value={form.employerName}
                                onChange={(e) =>
                                  updateForm("employerName", e.target.value)
                                }
                                placeholder="選填 / Optional"
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1">
                                雇主電話
                              </label>
                              <input
                                type="tel"
                                value={form.employerPhone}
                                onChange={(e) =>
                                  updateForm("employerPhone", e.target.value)
                                }
                                placeholder="選填 / Optional"
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1">
                                仲介姓名 Broker
                              </label>
                              <input
                                type="text"
                                value={form.brokerName}
                                onChange={(e) =>
                                  updateForm("brokerName", e.target.value)
                                }
                                placeholder="選填 / Optional"
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-text-muted mb-1">
                                仲介電話
                              </label>
                              <input
                                type="tel"
                                value={form.brokerPhone}
                                onChange={(e) =>
                                  updateForm("brokerPhone", e.target.value)
                                }
                                placeholder="選填 / Optional"
                                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-primary-light"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!form.city || !form.address}
                  className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
                >
                  {T("next_step_members")}
                </button>
                <button
                  onClick={generateHandbook}
                  disabled={loading || !form.city || !form.address}
                  className="w-full border border-border text-text-muted py-2 rounded-lg text-sm hover:bg-surface transition-colors disabled:opacity-40"
                >
                  {loading ? loadingMsg || T("generating") : T("skip_generate")}
                </button>
              </div>
            )}

            {/* Step 2: 家庭成員 */}
            {step === 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
                <h2 className="text-lg font-bold text-text">
                  {T("members_title")}
                </h2>
                <p className="text-sm text-text-muted">{T("members_desc")}</p>

                <div className="space-y-3">
                  {form.members.map((m, i) => (
                    <MemberForm
                      key={i}
                      index={i}
                      member={m}
                      onChange={updateMember}
                      onRemove={(i) =>
                        setForm((prev) => ({
                          ...prev,
                          members: prev.members.filter((_, idx) => idx !== i),
                        }))
                      }
                      canRemove={form.members.length > 1}
                      locale={locale}
                      onOpenMap={(target, idx) => {
                        setMapTarget({ type: target, memberIndex: idx });
                        setMode("map");
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      members: [...prev.members, defaultMember()],
                    }))
                  }
                  className="w-full border-2 border-dashed border-border text-text-faint py-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  + 新增成員
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 border border-border text-text-muted py-3 rounded-lg font-semibold hover:bg-surface transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={false}
                    className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-primary-dark transition-colors"
                  >
                    下一步：緊急聯絡
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: 緊急聯絡人 */}
            {step === 3 && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 border border-border">
                <h2 className="text-lg font-bold text-text">
                  {T("contacts_title")}
                </h2>
                <p className="text-sm text-text-muted">{T("contacts_desc")}</p>

                <div className="space-y-3">
                  {form.contacts.map((c, i) => (
                    <ContactForm
                      key={i}
                      index={i}
                      contact={c}
                      onChange={updateContact}
                      onRemove={(i) =>
                        setForm((prev) => ({
                          ...prev,
                          contacts: prev.contacts.filter((_, idx) => idx !== i),
                        }))
                      }
                      canRemove={form.contacts.length > 1}
                      onOpenMap={(idx) => {
                        setMapTarget({ type: "contact", memberIndex: idx });
                        setMode("map");
                      }}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      contacts: [...prev.contacts, defaultContact()],
                    }))
                  }
                  className="w-full border-2 border-dashed border-border text-text-faint py-2 rounded-lg hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  + 新增聯絡人
                </button>

                {error && (
                  <div className="bg-error/10 text-error px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 border border-border text-text-muted py-3 rounded-lg font-semibold hover:bg-surface transition-colors"
                  >
                    上一步
                  </button>
                  <button
                    onClick={generateHandbook}
                    disabled={loading}
                    className="flex-1 bg-accent text-white py-3 rounded-lg font-semibold disabled:opacity-40 hover:bg-accent-dark transition-colors"
                  >
                    {loading ? loadingMsg || T("generating") : T("generate")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Updates & Footer */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        {/* 資料更新 — what the dataset contains, refreshed weekly.
            Separated from product updates because data freshness is its own
            trust signal (users can see the tool is actively maintained even
            when no features shipped that week). */}
        <details className="bg-white rounded-xl shadow-card border border-border">
          <summary className="px-4 py-3 cursor-pointer select-none flex items-center justify-between text-sm font-semibold text-text-muted hover:text-text transition-colors">
            <span>{T("updates_data_title")}</span>
            <span className="text-xs font-normal text-text-faint">
              {T("updates_last")}: 2026/4/8
            </span>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-border/50">
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/8</span>
                <span>
                  {locale === "en"
                    ? "Air raid shelters expanded: 71K → 74K+ (merged g0v open data, major fills for Hsinchu, Yilan, Hualien, Kinmen)"
                    : "防空避難資料擴充：71K → 74K+（整合 g0v 開放資料，新竹市/宜蘭/花蓮/金門大幅補齊）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/8</span>
                <span>
                  {locale === "en"
                    ? "Added 1,499 nursing institutions (nursing homes with coordinates) from MOHW"
                    : "新增 1,499 間護理機構資料（含座標），來源：衛福部護理機構名冊"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/2</span>
                <span>
                  {locale === "en"
                    ? "Weekly data refresh: medical facilities updated to 16,900+ (all with precise coordinates)"
                    : "每週資料更新：醫療院所更新至 16,900+ 筆（全部精確定位），含金門連江離島"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/26</span>
                <span>
                  {locale === "en"
                    ? "Added 770 fire stations and 1,686 police stations with phone numbers"
                    : "新增全國 770 個消防隊、1,686 個派出所資料（含電話）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/26</span>
                <span>
                  {locale === "en"
                    ? "Auto-update now runs weekly — shelters, medical, AED, fire & police stations"
                    : "資料自動更新改為每週 — 避難所、醫療、AED、消防、派出所全部涵蓋"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/26</span>
                <span>
                  {locale === "en"
                    ? "Address geocoding upgraded to Google-first for precise results"
                    : "地址定位改為 Google 優先，定位精度提升至門牌等級"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/20</span>
                <span>
                  {locale === "en"
                    ? "Added 83,000+ shelter/air raid data points; MRT stations as air raid shelters"
                    : "全台避難收容、防空避難資料突破 83,000 筆；捷運站納入防空避難選項"}
                </span>
              </li>
            </ul>
            <p className="mt-3 text-[10px] text-text-faint">
              {locale === "en"
                ? "Data sources: MOHW, NHI, National Fire Agency, NPA, county/city open data. Auto-updated weekly."
                : "資料來源：衛福部、健保署、消防署、警政署、各縣市政府開放資料。每週自動更新。"}
            </p>
          </div>
        </details>

        {/* 產品更新 — features, UI, bug fixes. */}
        <details className="bg-white rounded-xl shadow-card border border-border">
          <summary className="px-4 py-3 cursor-pointer select-none flex items-center justify-between text-sm font-semibold text-text-muted hover:text-text transition-colors">
            <span>{T("updates_product_title")}</span>
            <span className="text-xs font-normal text-text-faint">
              {T("updates_last")}: 2026/4/24
            </span>
          </summary>
          <div className="px-4 pb-4 pt-1 border-t border-border/50">
            <ul className="space-y-2 text-xs text-text-muted">
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Auto-detect browser language: non-Chinese visitors now land in their language (en/vi/id/th/fil) — no more hunting for the globe dropdown"
                    : "自動偵測瀏覽器語言：非中文使用者直接進入對應語言頁面（英/越/印/泰/菲），不用再找右上角語言切換"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Map picker now opens at Taipei city view instead of the whole island — tap-to-search works immediately; GPS still jumps to your neighborhood if you allow it"
                    : "地圖工具改為台北市區預設視野（原本是整個台灣），可直接點按查詢；允許定位就自動跳到你的鄰里"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Updates split into Data (government datasets, weekly refresh) and Product (features & UI) — easier to see what's fresh"
                    : "「近期更新」拆成「資料更新」（政府開放資料，每週自動更新）和「功能更新」（介面與功能變動），兩種新鮮度各自獨立顯示"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Homepage polish: larger hero heading, simpler foreign-national CTA, quieter emergency shortcut so the main address-lookup is the clear primary action"
                    : "首頁介面整理：主標題放大、「外籍人士？」連結簡化、緊急電話按鈕改為次要樣式，讓「輸入我的地址」是最清楚的主要動作"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Shareable language links: ?lang=en, ?lang=vi, etc. now work — send a link in your language, recipient opens in that language"
                    : "語系可分享：網址帶 ?lang=en / ?lang=vi 等會直接以該語言開啟，方便傳給不同語言的人"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "Accessibility: all homepage buttons and links now meet the 44px minimum tap-target — easier on mobile"
                    : "行動裝置可用性提升：首頁所有按鈕與連結皆達 44px 最小點擊範圍"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/24</span>
                <span>
                  {locale === "en"
                    ? "PDF and website now use the exact same brand teal — no more visible color shift between what you see and what you download"
                    : "網站與 PDF 的主色統一（過去兩邊綠色稍有差異），下載的手冊和網站看到的顏色一致"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/17</span>
                <span>
                  {locale === "en"
                    ? "New usage guide page in PDF for foreign nationals: explains which page to show to locals/drivers vs read yourself, 4 emergency scenarios mapped to handbook pages"
                    : "外籍人士 PDF 新增「使用說明頁」：哪一頁給路人/司機看、哪一頁自己看，4 種情境對應到手冊指定頁數"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/17</span>
                <span>
                  {locale === "en"
                    ? "QR code hint clarified: foreign nationals can show shelter page to locals — they can help navigate"
                    : "QR Code 提示文字改進：外籍人士可把避難所頁指給路人看，請他們帶你去"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/17</span>
                <span>
                  {locale === "en"
                    ? "Fixed PDF text overlap on Foreign Nationals page (hotline column widths, language-aware rendering)"
                    : "修復 PDF 外籍人士頁文字重疊問題（熱線欄位寬度、依語言顯示對應翻譯）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/16</span>
                <span>
                  {locale === "en"
                    ? "Translation review (Gemini): 16 fixes applied across vi/id/th/fil — more idiomatic for migrants in Taiwan. DRAFT watermark removed."
                    : "翻譯審校（Gemini）：越/印/泰/菲 16 處修正，更符合在台移工實際用語。DRAFT 警示已移除。"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/16</span>
                <span>
                  {locale === "en"
                    ? "New /emergency page: large tap-to-call buttons for 119/110/1955/113, works offline"
                    : "新增緊急電話頁：大按鈕一鍵撥打 119/110/1955/113，離線可用"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/16</span>
                <span>
                  {locale === "en"
                    ? "Foreign national / migrant worker split: choose your status for tailored resources (employer/broker fields only for workers)"
                    : "外籍居民 vs 外籍移工區隔：選擇身分後顯示對應資源（雇主/仲介欄位僅移工顯示）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/16</span>
                <span>
                  {locale === "en"
                    ? "Complete UI translations for Vietnamese, Indonesian, Thai, Filipino (92/92 keys each)"
                    : "越/印/泰/菲介面翻譯補齊（92 個翻譯鍵全部完成）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/15</span>
                <span>
                  {locale === "en"
                    ? "Migrant worker mode: multilingual emergency phrase card (ZH/EN/VI/ID/TH/FIL) added to PDF when foreign national checkbox is enabled"
                    : "外籍移工模式：勾選「外籍人士」後，PDF 會加入多語緊急用語卡（中/英/越/印/泰/菲 6 語對照）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/15</span>
                <span>
                  {locale === "en"
                    ? "Added 113 (Women & Children Protection Hotline) and 1955 to emergency card for foreign nationals"
                    : "緊急聯絡卡加入 1955 勞工專線與 113 婦幼保護專線（外籍人士模式）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/15</span>
                <span>
                  {locale === "en"
                    ? "Homepage CTA: foreign residents can one-click enable migrant/resident mode"
                    : "首頁新增「外籍人士？啟用專屬模式」快速連結"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/14</span>
                <span>
                  {locale === "en"
                    ? "Multi-language UI: added beta support for Vietnamese, Indonesian, Thai, and Filipino"
                    : "介面多語支援：新增越南語、印尼語、泰語、菲律賓語（Beta 測試版）"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/8</span>
                <span>
                  {locale === "en"
                    ? "UX: fixed emergency card font, improved offline support, redesigned share preview image"
                    : "體驗優化：修復緊急卡片字型、強化離線支援、重新設計社群分享預覽圖"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/7</span>
                <span>
                  {locale === "en"
                    ? "Interactive map: tap anywhere to find nearby shelters, clinics, fire stations — all address fields support map pick"
                    : "互動地圖：點擊任意位置查看附近避難設施。所有地址欄位都支援地圖點選定位"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">4/7</span>
                <span>
                  {locale === "en"
                    ? "Clickable header: tap title on any page to return home"
                    : "點擊標題即可回到首頁，流程更順暢"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/26</span>
                <span>
                  {locale === "en"
                    ? "New emergency contact card — view on phone or screenshot, with family locations and tap-to-call"
                    : "新增緊急聯絡卡 — 手機直接看或截圖，含家人位置與一鍵撥號"}
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary shrink-0">3/26</span>
                <span>
                  {locale === "en"
                    ? "UX improvements: cleaner search flow, phone field for members, darker input text"
                    : "操作優化：搜尋結果後自動收起表單、成員可填手機號碼、輸入文字更清晰"}
                </span>
              </li>
            </ul>
          </div>
        </details>
      </div>

      {/* Feedback & Footer */}
      <div className="max-w-2xl mx-auto px-4 pb-8 space-y-4">
        <div className="bg-white rounded-xl shadow-card border border-border p-4 space-y-2">
          <p className="text-xs font-semibold text-text-muted mb-1">
            {locale === "en" ? "Help us improve" : "資料有誤？幫助我們改善"}
          </p>
          <a
            href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=data-correction.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[44px] border border-warning/30 bg-warning/10 text-warning px-3 rounded-lg text-sm hover:bg-warning/15 transition-colors"
          >
            {locale === "en" ? "📍 Report data error" : "📍 回報資料錯誤"}
          </a>
          <a
            href="https://github.com/siriushsu/taiwan-disaster-handbook/issues/new?template=feature-request.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[44px] border border-border text-text-muted px-3 rounded-lg text-sm hover:bg-surface transition-colors"
          >
            {locale === "en" ? "💡 Feature request" : "💡 功能建議"}
          </a>
          <a
            href="https://github.com/siriushsu/taiwan-disaster-handbook"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[44px] text-text-faint text-xs px-3 hover:underline"
          >
            {locale === "en"
              ? "⭐ Open source project — contributions welcome"
              : "⭐ 開源專案 — 歡迎貢獻"}
          </a>
        </div>

        <div className="bg-white rounded-xl shadow-card border border-border p-4">
          {!showSupport ? (
            <button
              onClick={() => setShowSupport(true)}
              className="w-full flex items-center justify-center min-h-[44px] text-sm text-accent hover:text-accent-dark font-medium transition-colors"
            >
              {locale === "en"
                ? "☕ Enjoying this? Buy the developer a coffee"
                : "☕ 覺得有幫助？請開發者喝杯咖啡"}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-text text-center">
                {locale === "en"
                  ? "Thank you for your support!"
                  : "感謝你的支持！"}
              </p>
              <a
                href="https://ko-fi.com/siriushsu"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center bg-accent text-white py-2.5 rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors"
              >
                ☕ Ko-fi（信用卡 / PayPal）
              </a>
              <div className="text-center">
                <p className="text-xs text-text-faint mb-1">或銀行轉帳</p>
                <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2">
                  <span className="text-sm text-text-muted">
                    玉山銀行 (808)
                  </span>
                  <span className="text-sm font-mono font-semibold text-text">
                    0521979118500
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("0521979118500");
                      alert("已複製帳號");
                    }}
                    className="text-xs bg-surface-muted hover:bg-border text-text-muted px-2 py-0.5 rounded transition-colors"
                  >
                    複製
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-text-faint">
                本專案為開源免費工具，您的支持幫助我們維護伺服器與持續改善內容
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-text-faint/50 py-2">
          v{APP_VERSION}
        </p>
      </div>
    </main>
  );
}
