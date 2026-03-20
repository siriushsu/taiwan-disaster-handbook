import type { GeoLocation, Shelter, MedicalFacility } from '@/types'

/** Haversine distance in meters */
function calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function findNearest<T extends { lat: number; lng: number; distance?: number }>(
  items: T[], lat: number, lng: number, limit: number
): T[] {
  return items
    .map(item => ({ ...item, distance: calcDist(lat, lng, item.lat, item.lng) }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, limit)
}

// CDN base URL (jsDelivr serves from GitHub with free unlimited bandwidth)
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/siriushsu/taiwan-disaster-handbook@main/public/data'

// In-memory cache
let shelterCache: Shelter[] | null = null
let medicalCache: MedicalFacility[] | null = null
let airRaidCache: { a: string; t: number; g: number; c: number | null }[] | null = null
let mrtCache: { a: string; t: number; g: number; c: number | null; n: string; s: string }[] | null = null

/** Fetch with fallback: try CDN first, fall back to local /data/ */
async function fetchData(filename: string): Promise<Response> {
  try {
    const res = await fetch(`${CDN_BASE}/${filename}`)
    if (res.ok) return res
  } catch { /* CDN failed, try local */ }
  return fetch(`/data/${filename}`)
}

async function loadShelters(): Promise<Shelter[]> {
  if (shelterCache) return shelterCache
  const res = await fetchData('taiwan-shelters.json')
  shelterCache = await res.json()
  return shelterCache!
}

async function loadMedical(): Promise<MedicalFacility[]> {
  if (medicalCache) return medicalCache
  const res = await fetchData('taiwan-medical.json')
  medicalCache = await res.json()
  return medicalCache!
}

async function loadAirRaid() {
  if (airRaidCache) return airRaidCache
  const res = await fetchData('taiwan-air-raid.json')
  airRaidCache = await res.json()
  return airRaidCache!
}

async function loadMrt() {
  if (mrtCache) return mrtCache
  const res = await fetchData('taiwan-mrt-shelters.json')
  mrtCache = await res.json()
  return mrtCache!
}

/** Geocode address using Nominatim (browser-side, CORS supported) */
export async function geocode(address: string): Promise<GeoLocation | null> {
  const normalized = address.replace(/臺/g, '台')
  const candidates = [
    normalized,
    normalized.replace(/\d+號.*$/, '').trim(),
    normalized.replace(/\d+之?\d*號.*$/, '').trim(),
  ].filter((s, i, arr) => s && arr.indexOf(s) === i)

  for (const q of candidates) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 10000)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=tw&accept-language=zh`,
        { signal: ctrl.signal }
      )
      clearTimeout(timer)
      if (!res.ok) continue
      const data = await res.json()
      if (data?.[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        }
      }
    } catch {
      continue
    }
  }
  return null
}

/** Find nearest shelters, air raid shelters, and medical facilities */
export async function findNearby(lat: number, lng: number) {
  const [shelters, airRaidRaw, medical, mrtRaw] = await Promise.all([
    loadShelters(),
    loadAirRaid(),
    loadMedical(),
    loadMrt(),
  ])

  // Nearest disaster shelters
  const nearShelters = findNearest(shelters, lat, lng, 5)

  // Air raid: bounding box pre-filter then nearest
  const delta = 0.03
  const airCandidates = airRaidRaw
    .filter(s => s.t > lat - delta && s.t < lat + delta && s.g > lng - delta && s.g < lng + delta)
    .map(s => {
      const shortName = s.a.replace(/^.+?[區鎮鄉市](.+?里)?/, '').trim() || s.a
      return { name: shortName, address: s.a, lat: s.t, lng: s.g, capacity: s.c ?? undefined, type: 'air_defense' as const } as Shelter
    })

  // MRT stations as air raid shelters (underground = safe during air raids)
  const mrtCandidates = mrtRaw
    .filter(s => s.t > lat - delta && s.t < lat + delta && s.g > lng - delta && s.g < lng + delta)
    .map(s => ({
      name: `${s.n}站（${s.s}）`,
      address: s.a,
      lat: s.t,
      lng: s.g,
      capacity: s.c ?? undefined,
      type: 'air_defense' as const,
    } as Shelter))

  // Merge air raid + MRT, deduplicate by proximity, return nearest 3
  const allAirRaid = [...airCandidates, ...mrtCandidates]
  const nearAirRaid = findNearest(allAirRaid, lat, lng, 3)

  // Nearest medical
  const nearMedical = findNearest(medical, lat, lng, 3)

  return { shelters: nearShelters, airRaid: nearAirRaid, medical: nearMedical }
}
