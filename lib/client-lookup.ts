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

// In-memory cache
let shelterCache: Shelter[] | null = null
let medicalCache: MedicalFacility[] | null = null
let airRaidCache: { a: string; t: number; g: number; c: number | null }[] | null = null

async function loadShelters(): Promise<Shelter[]> {
  if (shelterCache) return shelterCache
  const res = await fetch('/data/taiwan-shelters.json')
  shelterCache = await res.json()
  return shelterCache!
}

async function loadMedical(): Promise<MedicalFacility[]> {
  if (medicalCache) return medicalCache
  const res = await fetch('/data/taiwan-medical.json')
  medicalCache = await res.json()
  return medicalCache!
}

async function loadAirRaid() {
  if (airRaidCache) return airRaidCache
  const res = await fetch('/data/taiwan-air-raid.json')
  airRaidCache = await res.json()
  return airRaidCache!
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
  const [shelters, airRaidRaw, medical] = await Promise.all([
    loadShelters(),
    loadAirRaid(),
    loadMedical(),
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
  const nearAirRaid = findNearest(airCandidates, lat, lng, 3)

  // Nearest medical
  const nearMedical = findNearest(medical, lat, lng, 3)

  return { shelters: nearShelters, airRaid: nearAirRaid, medical: nearMedical }
}
