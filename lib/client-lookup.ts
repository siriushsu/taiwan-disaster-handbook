import type {
  GeoLocation,
  Shelter,
  MedicalFacility,
  FireStation,
  PoliceStation,
} from "@/types";

/** Haversine distance in meters */
function calcDist(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearest<T extends { lat: number; lng: number; distance?: number }>(
  items: T[],
  lat: number,
  lng: number,
  limit: number,
): T[] {
  return items
    .map((item) => ({
      ...item,
      distance: calcDist(lat, lng, item.lat, item.lng),
    }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, limit);
}

// CDN base URL (jsDelivr serves from GitHub with free unlimited bandwidth)
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/siriushsu/taiwan-disaster-handbook@main/public/data";

// In-memory cache
let shelterCache: Shelter[] | null = null;
let medicalCache: MedicalFacility[] | null = null;
let airRaidCache:
  | { a: string; t: number; g: number; c: number | null }[]
  | null = null;
let mrtCache:
  | {
      a: string;
      t: number;
      g: number;
      c: number | null;
      n: string;
      s: string;
    }[]
  | null = null;
let aedCache:
  | {
      name: string;
      address: string;
      city: string;
      district: string;
      lat: number;
      lng: number;
      location: string;
      phone: string;
      allDay: boolean;
    }[]
  | null = null;
let fireStationCache: FireStation[] | null = null;
let policeStationCache: PoliceStation[] | null = null;

/** Fetch with fallback: try CDN first, fall back to local /data/ */
async function fetchData(filename: string): Promise<Response> {
  try {
    const res = await fetch(`${CDN_BASE}/${filename}`);
    if (res.ok) return res;
  } catch {
    /* CDN failed, try local */
  }
  return fetch(`/data/${filename}`);
}

async function loadShelters(): Promise<Shelter[]> {
  if (shelterCache) return shelterCache;
  const res = await fetchData("taiwan-shelters.json");
  if (!res.ok) throw new Error(`Failed to load shelters: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data))
    throw new Error("Invalid shelter data: expected array");
  shelterCache = data;
  return shelterCache;
}

async function loadMedical(): Promise<MedicalFacility[]> {
  if (medicalCache) return medicalCache;
  const res = await fetchData("taiwan-medical.json");
  if (!res.ok)
    throw new Error(`Failed to load medical data: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data))
    throw new Error("Invalid medical data: expected array");
  medicalCache = data;
  return medicalCache;
}

async function loadAirRaid() {
  if (airRaidCache) return airRaidCache;
  const res = await fetchData("taiwan-air-raid.json");
  if (!res.ok)
    throw new Error(`Failed to load air-raid data: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data))
    throw new Error("Invalid air-raid data: expected array");
  airRaidCache = data;
  return airRaidCache;
}

async function loadMrt() {
  if (mrtCache) return mrtCache;
  const res = await fetchData("taiwan-mrt-shelters.json");
  if (!res.ok) throw new Error(`Failed to load MRT data: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid MRT data: expected array");
  mrtCache = data;
  return mrtCache;
}

async function loadAed() {
  if (aedCache) return aedCache;
  const res = await fetchData("taiwan-aed.json");
  if (!res.ok) throw new Error(`Failed to load AED data: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Invalid AED data: expected array");
  aedCache = data;
  return aedCache;
}

async function loadFireStations(): Promise<FireStation[]> {
  if (fireStationCache) return fireStationCache;
  const res = await fetchData("taiwan-fire-stations.json");
  if (!res.ok) return [];
  const data = await res.json();
  fireStationCache = Array.isArray(data) ? data : [];
  return fireStationCache;
}

async function loadPoliceStations(): Promise<PoliceStation[]> {
  if (policeStationCache) return policeStationCache;
  const res = await fetchData("taiwan-police-stations.json");
  if (!res.ok) return [];
  const data = await res.json();
  policeStationCache = Array.isArray(data) ? data : [];
  return policeStationCache;
}

/** Helper: fetch with timeout */
async function fetchWithTimeout(
  url: string,
  timeoutMs = 8000,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

/** Try Nominatim geocoder */
async function tryNominatim(query: string): Promise<GeoLocation | null> {
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&limit=5&countrycodes=tw&accept-language=zh&addressdetails=1`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;

    // Priority: building/amenity/shop > house > road
    // Higher place_rank = more specific (30=building, 26=road, 16=city)
    const scored = data.map((d: Record<string, unknown>) => {
      let score = 0;
      const cat = d.category || d.class;
      if (cat === "building" || cat === "amenity" || cat === "shop")
        score += 100;
      if (d.type === "house") score += 80;
      if (d.addresstype === "building") score += 60;
      const rank = Number(d.place_rank) || 0;
      score += rank; // higher rank = more specific
      return { ...d, _score: score };
    });
    scored.sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        (b._score as number) - (a._score as number),
    );
    const best = scored[0];
    const lat = parseFloat(best.lat as string);
    const lng = parseFloat(best.lon as string);
    if (isNaN(lat) || isNaN(lng)) return null;
    return {
      lat,
      lng,
      formattedAddress: (best.display_name as string) || "",
    };
  } catch {
    /* skip */
  }
  return null;
}

/** Try Photon (Komoot) geocoder — with city verification */
async function tryPhoton(
  query: string,
  expectedCity?: string,
): Promise<GeoLocation | null> {
  try {
    const res = await fetchWithTimeout(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=default&lat=23.5&lon=121&bbox=118,20,123,27`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const features = data?.features || [];
    for (const feat of features) {
      if (!feat?.geometry?.coordinates) continue;
      const [lng, lat] = feat.geometry.coordinates;
      if (!(lat >= 20 && lat <= 27 && lng >= 118 && lng <= 123)) continue;
      // Verify city matches if we have an expected city
      if (expectedCity) {
        const props = feat.properties || {};
        const rCity = (props.city || props.county || props.state || "").replace(
          /臺/g,
          "台",
        );
        const eCity = expectedCity.replace(/臺/g, "台");
        if (
          rCity &&
          eCity &&
          !rCity.includes(eCity.slice(0, 2)) &&
          !eCity.includes(rCity.slice(0, 2))
        ) {
          continue; // Wrong city, skip
        }
      }
      return {
        lat,
        lng,
        formattedAddress: feat.properties?.name || query,
      };
    }
  } catch {
    /* skip */
  }
  return null;
}

/**
 * Parse a Taiwan address into parts for flexible query building.
 * e.g. "台北市大安區敦化南路一段205號" →
 *   { city: "台北市", district: "大安區", street: "敦化南路一段", number: "205" }
 */
function parseAddress(addr: string) {
  const m = addr.match(
    /^([\u4e00-\u9fff]{2,3}[市縣])?([\u4e00-\u9fff]{2,3}[區鄉鎮市])?(.*?)(\d+)號?(.*)$/,
  );
  if (!m) return null;
  return {
    city: m[1] || "",
    district: m[2] || "",
    street: m[3]?.trim() || "",
    number: m[4] || "",
    rest: m[5]?.trim() || "",
  };
}

/** Geocode address using multiple providers for better accuracy */
export async function geocode(
  address: string,
  hint?: { city?: string; district?: string },
): Promise<GeoLocation | null> {
  // Normalize: 臺→台 for better matching
  const normalized = address.replace(/臺/g, "台");
  const parsed = parseAddress(normalized);

  // Use hint from form fields if parseAddress couldn't extract city/district
  const city = (parsed?.city || hint?.city || "").replace(/臺/g, "台");
  const district = (parsed?.district || hint?.district || "").replace(
    /臺/g,
    "台",
  );

  // Build candidate queries in priority order:
  // 1. "區名+街道名 門牌號" (disambiguates same-name streets across cities)
  // 2. "城市+街道名 門牌號" (if district is empty, at least use city)
  // 3. Full address
  // 4. Street-level fallback (no number)
  const candidates: string[] = [];
  if (parsed?.street && parsed?.number) {
    // IMPORTANT: Include district to disambiguate (成功路 exists in many cities)
    if (district) {
      candidates.push(`${district}${parsed.street} ${parsed.number}`); // "永和區成功路二段 191"
    }
    // If no district but city is known, use city for basic disambiguation
    if (!district && city) {
      candidates.push(`${city}${parsed.street} ${parsed.number}`); // "新北市成功路二段 191"
    }
    // Without any location context as last resort
    candidates.push(`${parsed.street} ${parsed.number}`); // "成功路二段 191"
  }
  candidates.push(normalized); // "台北市大安區敦化南路一段205號"
  if (parsed?.street && district) {
    candidates.push(
      `${parsed.street}, ${district}, ${city}`.replace(/^,\s*|,\s*$/g, ""),
    );
  }
  // Remove duplicates
  const unique = candidates.filter((s, i, arr) => s && arr.indexOf(s) === i);

  // Strategy 1: Try the best query format on both providers
  // Pass district-prefixed query to Photon too, and verify city
  const photonQuery = unique[0] || normalized;
  const [nomResult, photonResult] = await Promise.allSettled([
    tryNominatim(unique[0]),
    tryPhoton(photonQuery, city),
  ]);

  const nom = nomResult.status === "fulfilled" ? nomResult.value : null;
  const pho = photonResult.status === "fulfilled" ? photonResult.value : null;

  // Prefer Nominatim POI-level result (building/amenity) over street-level
  if (nom) {
    return nom;
  }
  if (pho) return pho;

  // Strategy 2: Fallback to remaining query formats
  for (let i = 1; i < unique.length; i++) {
    const result = await tryNominatim(unique[i]);
    if (result) return result;
  }

  // Strategy 3: Google Geocoding API fallback (server-side, preserves API key)
  try {
    const res = await fetchWithTimeout(
      `/api/geocode?address=${encodeURIComponent(address)}`,
      10000,
    );
    if (res.ok) {
      const data = await res.json();
      if (data.lat && data.lng) {
        return {
          lat: data.lat,
          lng: data.lng,
          formattedAddress: data.formattedAddress || address,
        };
      }
    }
  } catch {
    /* Google fallback also failed */
  }

  return null;
}

/** Find nearest shelters, air raid shelters, medical facilities, and AEDs */
export async function findNearby(lat: number, lng: number) {
  const [shelters, airRaidRaw, medical, mrtRaw, aedRaw, fireRaw, policeRaw] =
    await Promise.all([
      loadShelters(),
      loadAirRaid(),
      loadMedical(),
      loadMrt(),
      loadAed(),
      loadFireStations(),
      loadPoliceStations(),
    ]);

  // Nearest disaster shelters
  const nearShelters = findNearest(shelters, lat, lng, 5);

  // Air raid: bounding box pre-filter then nearest
  const delta = 0.03;
  const airCandidates = airRaidRaw
    .filter(
      (s) =>
        s.t > lat - delta &&
        s.t < lat + delta &&
        s.g > lng - delta &&
        s.g < lng + delta,
    )
    .map((s) => {
      const shortName = s.a.replace(/^.+?[區鎮鄉市](.+?里)?/, "").trim() || s.a;
      return {
        name: shortName,
        address: s.a,
        lat: s.t,
        lng: s.g,
        capacity: s.c ?? undefined,
        type: "air_defense" as const,
      } as Shelter;
    });

  // MRT stations as air raid shelters (underground = safe during air raids)
  const mrtCandidates = mrtRaw
    .filter(
      (s) =>
        s.t > lat - delta &&
        s.t < lat + delta &&
        s.g > lng - delta &&
        s.g < lng + delta,
    )
    .map(
      (s) =>
        ({
          name: `${s.n}站（${s.s}）`,
          address: s.a,
          lat: s.t,
          lng: s.g,
          capacity: s.c ?? undefined,
          type: "air_defense" as const,
        }) as Shelter,
    );

  // Merge air raid + MRT, deduplicate by proximity, return nearest 3
  const allAirRaid = [...airCandidates, ...mrtCandidates];
  const nearAirRaid = findNearest(allAirRaid, lat, lng, 3);

  // Nearest medical: bounding box pre-filter, then nearest by distance
  const medDelta = 0.02; // ~2km pre-filter box
  const medCandidates = medical.filter(
    (m) =>
      m.lat > lat - medDelta &&
      m.lat < lat + medDelta &&
      m.lng > lng - medDelta &&
      m.lng < lng + medDelta,
  );
  // If too few in 2km, expand to 5km
  const medPool =
    medCandidates.length >= 5
      ? medCandidates
      : medical.filter(
          (m) =>
            m.lat > lat - 0.05 &&
            m.lat < lat + 0.05 &&
            m.lng > lng - 0.05 &&
            m.lng < lng + 0.05,
        );

  const nearAllMedical = findNearest(medPool, lat, lng, 20);
  const hospitalsWithER = nearAllMedical.filter((m) => m.hasER);
  const nearERHospital = hospitalsWithER.slice(0, 1);

  // Take closest 3 (any type), plus 1 hospital if not already in top 3
  const seen = new Set<string>();
  const nearMedical: typeof nearAllMedical = [];
  for (const m of nearAllMedical) {
    const key = `${m.name}_${m.address}`;
    if (seen.has(key)) continue;
    seen.add(key);
    nearMedical.push(m);
    if (nearMedical.length >= 3) break;
  }
  // Ensure at least 1 hospital in results
  if (!nearMedical.some((m) => m.type === "hospital")) {
    const nearestHosp = nearAllMedical.find(
      (m) => m.type === "hospital" && !seen.has(`${m.name}_${m.address}`),
    );
    if (nearestHosp) nearMedical.push(nearestHosp);
  }

  // Nearest AED
  const aedCandidates = aedRaw
    .filter(
      (a) =>
        a.lat > lat - delta &&
        a.lat < lat + delta &&
        a.lng > lng - delta &&
        a.lng < lng + delta,
    )
    .map((a) => ({ ...a, distance: calcDist(lat, lng, a.lat, a.lng) }));
  aedCandidates.sort((a, b) => a.distance - b.distance);
  const nearAed = aedCandidates.slice(0, 3);

  // Nearest fire station (only those with coords)
  const fireWithCoords = fireRaw.filter(
    (f): f is FireStation & { lat: number; lng: number } =>
      f.lat != null && f.lng != null,
  );
  const nearFire = findNearest(fireWithCoords, lat, lng, 1);

  // Nearest police station (only those with coords)
  const policeWithCoords = policeRaw.filter(
    (p): p is PoliceStation & { lat: number; lng: number } =>
      p.lat != null && p.lng != null,
  );
  const nearPolice = findNearest(policeWithCoords, lat, lng, 1);

  return {
    shelters: nearShelters,
    airRaid: nearAirRaid,
    medical: nearMedical,
    erHospital: nearERHospital,
    aed: nearAed,
    fireStation: nearFire,
    policeStation: nearPolice,
  };
}
