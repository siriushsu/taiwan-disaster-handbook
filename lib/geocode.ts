import type { GeoLocation } from '@/types'

async function nominatimSearch(query: string, retries = 2): Promise<GeoLocation | null> {
  const encoded = encodeURIComponent(query)
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt))
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=tw&accept-language=zh`,
        {
          headers: {
            'User-Agent': 'TaiwanDisasterHandbook/1.0 (public safety app)',
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      )
      if (res.status === 429 && attempt < retries) continue
      if (!res.ok) return null
      const data = await res.json()
      if (data?.[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formattedAddress: data[0].display_name,
        }
      }
      return null
    } catch {
      if (attempt === retries) return null
    }
  }
  return null
}

// 使用 OpenStreetMap Nominatim 進行地址 geocoding
// Tries multiple formats for better match rate
export async function geocodeAddress(address: string): Promise<GeoLocation | null> {
  // 臺 → 台 (both work but 台 often matches better in Nominatim)
  const normalized = address.replace(/臺/g, '台')

  // Try multiple address formats in order
  const candidates = [
    normalized,
    normalized.replace(/\d+號.*$/, '').trim(),   // strip building number
    normalized.replace(/\d+之?\d*號.*$/, '').trim(), // strip number+suffix
  ].filter((s, i, arr) => s && arr.indexOf(s) === i)

  for (const candidate of candidates) {
    try {
      const result = await nominatimSearch(candidate)
      if (result) return result
    } catch {
      continue
    }
  }
  return null
}

// 計算兩點距離（Haversine，單位：公尺）
export function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}
