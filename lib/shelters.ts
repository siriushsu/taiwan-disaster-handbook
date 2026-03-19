import type { Shelter, MedicalFacility } from '@/types'
import { calcDistance } from './geocode'
import taiwanSheltersData from './data/taiwan-shelters.json'
import taiwanMedicalData from './data/taiwan-medical.json'
import taiwanAirRaidData from './data/taiwan-air-raid.json'

// 內政部消防署 避難收容處所 (5,887 locations)
const STATIC_SHELTERS: Shelter[] = taiwanSheltersData as Shelter[]

// OpenStreetMap 醫療院所 (2,623 locations)
const STATIC_MEDICAL: MedicalFacility[] = taiwanMedicalData as MedicalFacility[]

// 警政署 防空避難所 (74,926 locations, compact format)
interface AirRaidCompact { a: string; t: number; g: number; c: number | null }
const AIR_RAID_RAW: AirRaidCompact[] = taiwanAirRaidData as AirRaidCompact[]

// Find nearest N facilities
export function findNearest<T extends { lat: number; lng: number; distance?: number }>(
  items: T[], userLat: number, userLng: number, limit = 5
): T[] {
  return items
    .map(item => ({ ...item, distance: calcDistance(userLat, userLng, item.lat, item.lng) }))
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
    .slice(0, limit)
}

// Pre-filter air raid shelters by bounding box before distance calc (optimization)
function findNearestAirRaid(lat: number, lng: number, limit = 3): Shelter[] {
  // ~3km bounding box filter first (0.03 deg ≈ 3km)
  const delta = 0.03
  const candidates = AIR_RAID_RAW.filter(s =>
    s.t > lat - delta && s.t < lat + delta &&
    s.g > lng - delta && s.g < lng + delta
  )

  const shelters: Shelter[] = candidates.map(s => {
    // Extract a short name from address (e.g. "新北市永和區民本里成功路二段193號" → "成功路二段193號")
    const shortName = s.a.replace(/^.+?[區鎮鄉市](.+?里)?/, '').trim() || s.a
    return {
      name: shortName,
      address: s.a,
      lat: s.t,
      lng: s.g,
      capacity: s.c ?? undefined,
      type: 'air_defense' as const,
    }
  })

  return findNearest(shelters, lat, lng, limit)
}

export async function getNearestShelters(lat: number, lng: number, _city: string): Promise<Shelter[]> {
  return findNearest(STATIC_SHELTERS, lat, lng, 5)
}

export async function getNearestAirRaidShelters(lat: number, lng: number): Promise<Shelter[]> {
  return findNearestAirRaid(lat, lng, 3)
}

export async function getNearestMedical(lat: number, lng: number): Promise<MedicalFacility[]> {
  return findNearest(STATIC_MEDICAL, lat, lng, 3)
}
